from sqlalchemy.orm import Session
from ..models.decision import Decision
from ..models.case import Case
from ..schemas.case import Case as CaseSchema
from ..rules.engine import rule_engine
from typing import Dict, Any
import json

class DecisionService:
    def evaluate_and_record(self, db: Session, case_id: str, rule_name: str, actor_id: str = None):
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError("Case not found")

        # Convert Case model to dict for rule engine
        # In a real scenario, we'd have a better serialization strategy
        case_facts = case.facts
        # Add root level fields to facts for easier access in rules
        case_facts["bond_amount"] = float(case.bond_amount) if case.bond_amount else 0
        
        # Evaluate
        result = rule_engine.evaluate_rule(rule_name, case_facts)

        # Record Decision (only if it leads to a definitive outcome, or just log it? 
        # For now, let's assume we log the evaluation as a decision if it fails, or proceed)
        
        # Note: In the architecture, the Orchestrator primarily calls this.
        # This service might just be for the explicit "Decision" entities.
        
        pass

    def record_decision(self, db: Session, case_id: str, decision_type: str, rationale: str, rule_version: str = "1.0", made_by: str = None, facts_snapshot: Dict[str, Any] = {}):
        decision = Decision(
            case_id=case_id,
            decision_type=decision_type,
            rationale=rationale,
            facts_at_decision=facts_snapshot,
            rule_version=rule_version,
            made_by=made_by
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)
        return decision

decision_service = DecisionService()
