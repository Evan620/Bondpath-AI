from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from pydantic import BaseModel

class RuleResult(BaseModel):
    rule_name: str
    passed: bool
    blockers: List[str] = []
    warnings: List[str] = []
    metadata: Dict[str, Any] = {}

class BaseRule(ABC):
    name: str = "base_rule"
    description: str = "Base rule description"
    version: str = "1.0"

    @abstractmethod
    def evaluate(self, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> RuleResult:
        """
        Evaluate the rule against the provided case facts.
        """
        pass

class RuleEngine:
    def __init__(self):
        self.rules: Dict[str, BaseRule] = {}

    def register_rule(self, rule: BaseRule):
        self.rules[rule.name] = rule

    def evaluate_rule(self, rule_name: str, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> RuleResult:
        if rule_name not in self.rules:
            raise ValueError(f"Rule '{rule_name}' not registered.")
        return self.rules[rule_name].evaluate(case_facts, context)

    def evaluate_all(self, case_facts: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, RuleResult]:
        results = {}
        for name, rule in self.rules.items():
            results[name] = rule.evaluate(case_facts, context)
        return results

# Singleton instance
rule_engine = RuleEngine()
