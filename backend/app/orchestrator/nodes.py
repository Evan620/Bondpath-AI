from .state import CaseState
from ..agents.intake import intake_agent
from ..agents.risk import risk_agent
from ..agents.explanation import explanation_agent
from ..rules.engine import rule_engine
from ..rules import bail_rules # Ensure rules are registered
from ..database import SessionLocal
from ..models.case import Case as CaseModel
from ..services.audit import AuditService

def intake_node(state: CaseState) -> CaseState:
    """
    Run the Intake Agent to extract facts from raw input.
    """
    raw_input = state['facts'].get('raw_input', {})
    if not raw_input:
        return state
        
    db = SessionLocal()
    try:
        output = intake_agent.run(raw_input)
        
        state['facts'].update(output)
        state['agent_outputs']['intake'] = output
        state['history'].append("Intake Agent ran")
        
        # Audit
        AuditService.log_action(db, state['case_id'], "INTAKE_PROCESSED", output)
        
    except Exception as e:
        state['blockers'].append(f"Intake Error: {str(e)}")
        AuditService.log_action(db, state['case_id'], "INTAKE_ERROR", {"error": str(e)})
    finally:
        db.close()
        
    return state

def dedup_node(state: CaseState) -> CaseState:
    """
    Check for existing cases with the same defendant details to prevent duplicates.
    """
    case_id = state['case_id']
    facts = state['facts']
    
    first_name = facts.get('defendant_first_name') or facts.get('defendant_name', '').split(' ')[0]
    last_name = facts.get('defendant_last_name') or (facts.get('defendant_name', '').split(' ')[-1] if ' ' in facts.get('defendant_name', '') else '')
    dob = facts.get('defendant_dob')

    if not (first_name and last_name):
        return state

    db = SessionLocal()
    try:
        # Simple exact match on Name + DOB (if available)
        query = db.query(CaseModel).filter(
            CaseModel.defendant_first_name.ilike(first_name),
            CaseModel.defendant_last_name.ilike(last_name),
            CaseModel.id != case_id
        )
        
        if dob:
            query = query.filter(CaseModel.defendant_dob == dob)
            
        existing_case = query.first()
        
        if existing_case:
            msg = f"Potential Duplicate Found: Case ID {existing_case.id} matches Defendant {first_name} {last_name}"
            state['history'].append(msg)
            data = {
                "is_duplicate": True,
                "existing_case_id": str(existing_case.id),
                "existing_case_state": existing_case.state
            }
            state['facts']['potential_duplicate'] = data
            
            # Audit
            AuditService.log_action(db, case_id, "DUPLICATE_DETECTED", data)
            
    except Exception as e:
        state['history'].append(f"Deduplication Check Failed: {str(e)}")
    finally:
        db.close()
        
    return state

def decision_node(state: CaseState) -> CaseState:
    """
    Evaluate rules based on current state to determine next state or blockers.
    """
    current = state['current_state']
    facts = state['facts']
    
    db = SessionLocal()
    try:
        if current == 'INTAKE':
            # Check Qualification
            result = rule_engine.evaluate_rule('qualification_check', facts)
            state['rule_results']['qualification'] = result.dict()
            
            if result.passed:
                state['current_state'] = 'QUALIFIED'
                state['next_actions'] = ['ASSIGN_ADVISOR']
                state['history'].append("Transition: INTAKE -> QUALIFIED")
                AuditService.log_action(db, state['case_id'], "CASE_QUALIFIED", result.dict())
            else:
                state['blockers'] = result.blockers
                # Stay in INTAKE or move to REJECTED? 
                # For now, stay in INTAKE with blockers
                state['history'].append("Blocked at INTAKE")
                AuditService.log_action(db, state['case_id'], "QUALIFICATION_FAILED", result.dict())
                
    except Exception as e:
        state['blockers'].append(f"Decision Error: {str(e)}")
    finally:
        db.close()
    
    return state

def risk_node(state: CaseState) -> CaseState:
    db = SessionLocal()
    try:
        facts = state['facts']
        output = risk_agent.run(facts)
        state['agent_outputs']['risk'] = output
        state['history'].append("Risk Agent ran")
        AuditService.log_action(db, state['case_id'], "RISK_ASSESSED", output)
    except Exception as e:
        state['history'].append(f"Risk Agent Failed: {str(e)}")
        AuditService.log_action(db, state['case_id'], "RISK_AGENT_ERROR", {"error": str(e)})
    finally:
        db.close()
    return state

def explanation_node(state: CaseState) -> CaseState:
    db = SessionLocal()
    try:
        context = {
            "current_state": state['current_state'],
            "facts": state['facts'],
            "rule_results": state['rule_results'],
            "risk_score": state['agent_outputs'].get('risk', {}),
            "blockers": state['blockers']
        }
        output = explanation_agent.run(context)
        state['agent_outputs']['explanation'] = output
        state['history'].append("Explanation Agent ran")
        AuditService.log_action(db, state['case_id'], "EXPLANATION_GENERATED", {"summary": output[:100] + "..."})
    except Exception as e:
        state['history'].append(f"Explanation Agent Failed: {str(e)}")
    finally:
        db.close()
    return state
