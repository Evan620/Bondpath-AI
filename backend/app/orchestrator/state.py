from typing import TypedDict, List, Dict, Any, Optional

class CaseState(TypedDict):
    # Case Identity
    case_id: str
    
    # Workflow State
    current_state: str  # INTAKE, QUALIFIED, ADVISOR_ACTIVE, etc.
    
    # Data
    facts: Dict[str, Any]
    derived_facts: Dict[str, Any]
    
    # Control Flow
    blockers: List[str]
    next_actions: List[str]
    
    # Agent/System Outputs
    agent_outputs: Dict[str, Any]
    rule_results: Dict[str, Any]
    
    # Audit
    history: List[str]
