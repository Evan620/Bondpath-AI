from typing import Dict, Any, List
from .engine import BaseRule, RuleResult, rule_engine
from decimal import Decimal

class QualificationRule(BaseRule):
    name = "qualification_check"
    description = "Checks if the case meets basic qualification criteria"
    version = "1.0"

    def evaluate(self, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> RuleResult:
        blockers = []
        # Support both flat dict (from API/tests) and nested (legacy?)
        bond_amount = float(case_facts.get("bond_amount", 0))
        state = case_facts.get("state_jurisdiction", "")
        
        # 1. Bond Amount Check
        if bond_amount <= 0:
            blockers.append("Bond amount must be greater than 0")
        if bond_amount > 500000:
            blockers.append(f"Bond amount ${bond_amount} exceeds limit")

        # 2. Jurisdiction Check
        # For now, only TX is supported in this hard rule
        if state not in ["TX"]:
            blockers.append(f"Jurisdiction '{state}' not supported")

        return RuleResult(
            rule_name=self.name,
            passed=len(blockers) == 0,
            blockers=blockers
        )

class FinancialFeasibilityRule(BaseRule):
    name = "financial_feasibility"
    description = "Checks if the proposed payment terms are financially feasible"
    version = "1.0"

    def evaluate(self, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> RuleResult:
        blockers = []
        warnings = []
        
        bond_amount = Decimal(str(case_facts.get("bond_amount", 0)))
        down_payment = Decimal(str(case_facts.get("financial", {}).get("down_payment", 0)))
        monthly_payment = Decimal(str(case_facts.get("financial", {}).get("monthly_payment", 0)))
        income = Decimal(str(case_facts.get("indemnitor", {}).get("income", 0)))

        # 1. Minimum Down Payment (e.g., 5% of bond) - Hard Rule
        min_down = bond_amount * Decimal("0.05")
        if down_payment < min_down:
            blockers.append(f"Down payment ${down_payment} is below minimum requirement of ${min_down} (5%)")

        # 2. Income Ratio (Monthly payment <= 15% of income) - Soft Rule/Warning
        if income > 0:
            ratio = monthly_payment / income
            if ratio > Decimal("0.15"):
                warnings.append(f"Monthly payment is {ratio*100:.1f}% of income (High Risk > 15%)")
        
        return RuleResult(
            rule_name=self.name,
            passed=len(blockers) == 0,
            blockers=blockers,
            warnings=warnings
        )


class DocumentCompletenessRule(BaseRule):
    name = "document_completeness"
    description = "Checks if all required documents needed for underwriting are present"
    version = "1.0"

    def evaluate(self, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> RuleResult:
        blockers = []
        uploaded_docs = [doc.get("type") for doc in case_facts.get("documents", [])]
        
        # Determine required docs based on bond size/type
        required_docs = ["indemnitor_id", "proof_of_income"]
        bond_amount = Decimal(str(case_facts.get("bond_amount", 0)))
        
        if bond_amount > 50000:
            required_docs.append("collateral_proof")

        for req in required_docs:
            if req not in uploaded_docs:
                blockers.append(f"Missing required document: {req}")

        return RuleResult(
            rule_name=self.name,
            passed=len(blockers) == 0,
            blockers=blockers
        )

class ComplianceRule(BaseRule):
    name = "compliance_check"
    description = "Checks for legal and regulatory violations"
    version = "1.0"

    def evaluate(self, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> RuleResult:
        blockers = []
        
        # Example: Felony constraints in Harris County (mock logic)
        jurisdiction = case_facts.get("defendant", {}).get("jail", "").lower()
        charge_type = case_facts.get("charge", {}).get("type", "misdemeanor")
        
        if "harris" in jurisdiction and charge_type == "felony":
            # Just a mock rule: 2 Indemnitors required for felony in Harris
            # Implementation depends on how we structure indemnitors list
            pass 

        return RuleResult(
            rule_name=self.name,
            passed=len(blockers) == 0,
            blockers=blockers
        )

# Register Rules
rule_engine.register_rule(QualificationRule())
rule_engine.register_rule(FinancialFeasibilityRule())
rule_engine.register_rule(DocumentCompletenessRule())
rule_engine.register_rule(ComplianceRule())

