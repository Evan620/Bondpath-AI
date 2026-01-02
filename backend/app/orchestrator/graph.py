from langgraph.graph import StateGraph, END
from .state import CaseState
from .nodes import intake_node, decision_node, risk_node, explanation_node, dedup_node

# Define Graph
workflow = StateGraph(CaseState)

# Add Nodes
workflow.add_node("intake_node", intake_node)
workflow.add_node("dedup_node", dedup_node)
workflow.add_node("decision_node", decision_node)
workflow.add_node("risk_node", risk_node)
workflow.add_node("explanation_node", explanation_node)

# Define Edges
# Flow: Intake -> Dedup -> Decision -> [if qualified] -> Risk -> Explanation -> End
#                                   -> [if blocked] -> Explanation -> End
def route_after_decision(state: CaseState):
    intent = state['facts'].get('intent_signal')
    
    # Urgent path: Skip standard decision if user wants out NOW
    if intent == 'GET_OUT_TODAY':
        return "risk_node"
        
    # Standard path: Check qualification
    if state['current_state'] == 'QUALIFIED':
        return "risk_node"
    else:
        # If checking cost or gathering info, explanation handles the parking logic
        return "explanation_node"

workflow.set_entry_point("intake_node")
workflow.add_edge("intake_node", "dedup_node")
workflow.add_edge("dedup_node", "decision_node")
workflow.add_conditional_edges(
    "decision_node",
    route_after_decision,
    {
        "risk_node": "risk_node",
        "explanation_node": "explanation_node"
    }
)
workflow.add_edge("risk_node", "explanation_node")
workflow.add_edge("explanation_node", END)

# Compile
app = workflow.compile()
