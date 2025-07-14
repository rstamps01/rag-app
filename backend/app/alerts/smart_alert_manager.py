# File: backend/app/alerts/smart_alert_manager.py
import uuid
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from enum import Enum
import json

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertCategory(Enum):
    PERFORMANCE = "performance"
    SECURITY = "security"
    CAPACITY = "capacity"
    AVAILABILITY = "availability"
    DATA_QUALITY = "data_quality"

class SmartAlertManager:
    """
    AI-powered alert management with context awareness and intelligent recommendations
    """
    
    def __init__(self):
        self.alert_history = []
        self.alert_rules = self._initialize_alert_rules()
        self.suppression_rules = {}
        self.escalation_policies = self._initialize_escalation_policies()
        
    def _initialize_alert_rules(self) -> Dict[str, Dict]:
        """Initialize default alert rules and thresholds"""
        return {
            'response_time': {
                'warning_threshold': 1000,  # ms
                'critical_threshold': 5000,  # ms
                'category': AlertCategory.PERFORMANCE
            },
            'error_rate': {
                'warning_threshold': 0.05,  # 5%
                'critical_threshold': 0.15,  # 15%
                'category': AlertCategory.AVAILABILITY
            },
            'gpu_memory': {
                'warning_threshold': 0.85,  # 85%
                'critical_threshold': 0.95,  # 95%
                'category': AlertCategory.CAPACITY
            },
            'cpu_usage': {
                'warning_threshold': 0.80,  # 80%
                'critical_threshold': 0.95,  # 95%
                'category': AlertCategory.PERFORMANCE
            },
            'disk_usage': {
                'warning_threshold': 0.85,  # 85%
                'critical_threshold': 0.95,  # 95%
                'category': AlertCategory.CAPACITY
            },
            'document_processing_failures': {
                'warning_threshold': 0.10,  # 10%
                'critical_threshold': 0.25,  # 25%
                'category': AlertCategory.DATA_QUALITY
            }
        }
    
    def _initialize_escalation_policies(self) -> Dict[str, Dict]:
        """Initialize alert escalation policies"""
        return {
            AlertSeverity.CRITICAL.value: {
                'immediate_notification': True,
                'escalation_time': 300,  # 5 minutes
                'max_escalations': 3
            },
            AlertSeverity.HIGH.value: {
                'immediate_notification': True,
                'escalation_time': 900,  # 15 minutes
                'max_escalations': 2
            },
            AlertSeverity.MEDIUM.value: {
                'immediate_notification': False,
                'escalation_time': 1800,  # 30 minutes
                'max_escalations': 1
            },
            AlertSeverity.LOW.value: {
                'immediate_notification': False,
                'escalation_time': 3600,  # 1 hour
                'max_escalations': 0
            }
        }

    async def generate_smart_alert(self, metric_data: Dict, context: Dict) -> Optional[Dict]:
        """Generate contextually relevant alerts with AI-powered analysis"""
        try:
            # Check if alert should be suppressed
            if self._should_suppress_alert(metric_data, context):
                return None
            
            # Calculate severity using multiple factors
            severity = self._calculate_severity(metric_data, context)
            
            # Generate alert only if severity warrants it
            if severity == AlertSeverity.LOW and not context.get('force_alert', False):
                return None
            
            alert = {
                'id': str(uuid.uuid4()),
                'timestamp': datetime.now().isoformat(),
                'severity': severity.value,
                'category': self._determine_category(metric_data).value,
                'title': self._generate_alert_title(metric_data, context, severity),
                'description': self._generate_alert_description(metric_data, context, severity),
                'recommendations': self._generate_recommendations(metric_data, context, severity),
                'affected_components': self._identify_affected_components(metric_data),
                'predicted_impact': self._predict_impact(metric_data, context),
                'auto_resolution': self._suggest_auto_resolution(metric_data, context),
                'metadata': {
                    'metric_values': metric_data,
                    'context': context,
                    'alert_rule_triggered': self._get_triggered_rule(metric_data),
                    'confidence_score': self._calculate_confidence(metric_data, context)
                }
            }
            
            # Store alert in history
            self.alert_history.append(alert)
            
            # Apply escalation policy
            await self._apply_escalation_policy(alert)
            
            logger.info(f"Generated alert: {alert['title']} (Severity: {severity.value})")
            return alert
            
        except Exception as e:
            logger.error(f"Error generating smart alert: {str(e)}")
            return None

    def _calculate_severity(self, metric_data: Dict, context: Dict) -> AlertSeverity:
        """Calculate alert severity based on multiple factors and AI analysis"""
        severity_score = 0
        factors = []
        
        # Check each metric against thresholds
        for metric_name, value in metric_data.items():
            if metric_name in self.alert_rules:
                rule = self.alert_rules[metric_name]
                
                if value >= rule.get('critical_threshold', float('inf')):
                    severity_score += 4
                    factors.append(f"{metric_name} critical")
                elif value >= rule.get('warning_threshold', float('inf')):
                    severity_score += 2
                    factors.append(f"{metric_name} warning")
        
        # Context-based severity adjustments
        if context.get('business_hours', False):
            severity_score += 1
            factors.append("business hours")
        
        if context.get('high_user_activity', False):
            severity_score += 1
            factors.append("high user activity")
        
        # Historical pattern analysis
        if self._is_recurring_issue(metric_data):
            severity_score += 1
            factors.append("recurring issue")
        
        # Determine final severity
        if severity_score >= 6:
            return AlertSeverity.CRITICAL
        elif severity_score >= 4:
            return AlertSeverity.HIGH
        elif severity_score >= 2:
            return AlertSeverity.MEDIUM
        else:
            return AlertSeverity.LOW

    def _determine_category(self, metric_data: Dict) -> AlertCategory:
        """Determine alert category based on metrics"""
        categories = []
        
        for metric_name in metric_data.keys():
            if metric_name in self.alert_rules:
                categories.append(self.alert_rules[metric_name]['category'])
        
        # Return most critical category or default to performance
        if AlertCategory.SECURITY in categories:
            return AlertCategory.SECURITY
        elif AlertCategory.AVAILABILITY in categories:
            return AlertCategory.AVAILABILITY
        elif AlertCategory.CAPACITY in categories:
            return AlertCategory.CAPACITY
        elif AlertCategory.DATA_QUALITY in categories:
            return AlertCategory.DATA_QUALITY
        else:
            return AlertCategory.PERFORMANCE

    def _generate_alert_title(self, metric_data: Dict, context: Dict, severity: AlertSeverity) -> str:
        """Generate contextual alert title"""
        primary_metric = max(metric_data.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0)
        metric_name, metric_value = primary_metric
        
        severity_prefix = {
            AlertSeverity.CRITICAL: "🚨 CRITICAL",
            AlertSeverity.HIGH: "⚠️ HIGH",
            AlertSeverity.MEDIUM: "⚡ MEDIUM",
            AlertSeverity.LOW: "ℹ️ LOW"
        }
        
        metric_titles = {
            'response_time': f"Response Time Elevated ({metric_value}ms)",
            'error_rate': f"Error Rate Spike ({metric_value:.1%})",
            'gpu_memory': f"GPU Memory High ({metric_value:.1%})",
            'cpu_usage': f"CPU Usage High ({metric_value:.1%})",
            'disk_usage': f"Disk Space Low ({metric_value:.1%})",
            'document_processing_failures': f"Document Processing Failures ({metric_value:.1%})"
        }
        
        title = metric_titles.get(metric_name, f"{metric_name.replace('_', ' ').title()} Alert")
        return f"{severity_prefix[severity]} {title}"

    def _generate_alert_description(self, metric_data: Dict, context: Dict, severity: AlertSeverity) -> str:
        """Generate detailed alert description with context"""
        descriptions = []
        
        for metric_name, value in metric_data.items():
            if metric_name in self.alert_rules:
                rule = self.alert_rules[metric_name]
                if value >= rule.get('warning_threshold', float('inf')):
                    descriptions.append(
                        f"{metric_name.replace('_', ' ').title()}: {value} "
                        f"(Threshold: {rule.get('warning_threshold')})"
                    )
        
        # Add context information
        context_info = []
        if context.get('business_hours'):
            context_info.append("during business hours")
        if context.get('high_user_activity'):
            context_info.append("with high user activity")
        
        base_description = "; ".join(descriptions)
        if context_info:
            base_description += f" - Occurred {', '.join(context_info)}"
        
        return base_description

    def _generate_recommendations(self, metric_data: Dict, context: Dict, severity: AlertSeverity) -> List[Dict]:
        """Generate actionable recommendations for alert resolution"""
        recommendations = []
        
        for metric_name, value in metric_data.items():
            if metric_name == 'response_time' and value > 1000:
                recommendations.append({
                    'action': 'Optimize Database Queries',
                    'description': 'Review and optimize slow database queries',
                    'priority': 'high',
                    'estimated_impact': 'Reduce response time by 30-50%'
                })
                
            elif metric_name == 'gpu_memory' and value > 0.85:
                recommendations.append({
                    'action': 'Clear GPU Memory Cache',
                    'description': 'Clear unused GPU memory and optimize batch sizes',
                    'priority': 'immediate',
                    'estimated_impact': 'Free up 20-30% GPU memory'
                })
                
            elif metric_name == 'error_rate' and value > 0.05:
                recommendations.append({
                    'action': 'Investigate Error Logs',
                    'description': 'Review recent error logs for patterns and root causes',
                    'priority': 'high',
                    'estimated_impact': 'Identify and fix error sources'
                })
        
        # Add general recommendations based on severity
        if severity == AlertSeverity.CRITICAL:
            recommendations.append({
                'action': 'Immediate Investigation Required',
                'description': 'Critical issue requires immediate attention and investigation',
                'priority': 'critical',
                'estimated_impact': 'Prevent system degradation'
            })
        
        return recommendations

    def _identify_affected_components(self, metric_data: Dict) -> List[str]:
        """Identify which system components are affected"""
        components = set()
        
        component_mapping = {
            'response_time': ['API Gateway', 'Database', 'Backend Services'],
            'gpu_memory': ['GPU', 'ML Models', 'Document Processor'],
            'cpu_usage': ['Backend Services', 'Document Processor'],
            'disk_usage': ['File System', 'Database', 'Document Storage'],
            'error_rate': ['API Gateway', 'Backend Services'],
            'document_processing_failures': ['Document Processor', 'OCR Engine', 'Vector Database']
        }
        
        for metric_name in metric_data.keys():
            if metric_name in component_mapping:
                components.update(component_mapping[metric_name])
        
        return list(components)

    def _predict_impact(self, metric_data: Dict, context: Dict) -> Dict:
        """Predict the potential impact of the alert condition"""
        impact_levels = {
            'user_experience': 'medium',
            'system_stability': 'low',
            'data_integrity': 'low',
            'business_operations': 'low'
        }
        
        # Adjust impact based on metrics
        for metric_name, value in metric_data.items():
            if metric_name == 'response_time' and value > 2000:
                impact_levels['user_experience'] = 'high'
            elif metric_name == 'error_rate' and value > 0.10:
                impact_levels['user_experience'] = 'high'
                impact_levels['business_operations'] = 'medium'
            elif metric_name == 'gpu_memory' and value > 0.95:
                impact_levels['system_stability'] = 'high'
        
        return {
            'predicted_impact': impact_levels,
            'estimated_users_affected': self._estimate_affected_users(metric_data, context),
            'estimated_duration': self._estimate_duration(metric_data),
            'business_impact_score': self._calculate_business_impact(impact_levels, context)
        }

    def _suggest_auto_resolution(self, metric_data: Dict, context: Dict) -> Optional[Dict]:
        """Suggest automatic resolution actions if safe and appropriate"""
        auto_actions = []
        
        for metric_name, value in metric_data.items():
            if metric_name == 'gpu_memory' and value > 0.90:
                auto_actions.append({
                    'action': 'clear_gpu_cache',
                    'description': 'Clear GPU memory cache',
                    'safety_level': 'safe',
                    'estimated_success_rate': 0.85
                })
            elif metric_name == 'cpu_usage' and value > 0.95:
                auto_actions.append({
                    'action': 'restart_worker_processes',
                    'description': 'Restart worker processes to free resources',
                    'safety_level': 'medium',
                    'estimated_success_rate': 0.70
                })
        
        if auto_actions:
            return {
                'available_actions': auto_actions,
                'recommendation': 'safe' if all(a['safety_level'] == 'safe' for a in auto_actions) else 'manual_review'
            }
        
        return None

    def _should_suppress_alert(self, metric_data: Dict, context: Dict) -> bool:
        """Determine if alert should be suppressed based on rules and history"""
        # Check for recent similar alerts
        recent_alerts = [
            alert for alert in self.alert_history[-10:]  # Last 10 alerts
            if (datetime.now() - datetime.fromisoformat(alert['timestamp'].replace('Z', '+00:00'))).seconds < 300  # 5 minutes
        ]
        
        # Suppress if too many similar alerts recently
        if len(recent_alerts) >= 3:
            return True
        
        # Check maintenance windows
        if context.get('maintenance_window', False):
            return True
        
        return False

    def _is_recurring_issue(self, metric_data: Dict) -> bool:
        """Check if this is a recurring issue based on history"""
        similar_alerts = 0
        for alert in self.alert_history[-20:]:  # Check last 20 alerts
            alert_metrics = alert.get('metadata', {}).get('metric_values', {})
            if any(metric in alert_metrics for metric in metric_data.keys()):
                similar_alerts += 1
        
        return similar_alerts >= 3

    def _get_triggered_rule(self, metric_data: Dict) -> Optional[str]:
        """Get the alert rule that was triggered"""
        for metric_name, value in metric_data.items():
            if metric_name in self.alert_rules:
                rule = self.alert_rules[metric_name]
                if value >= rule.get('critical_threshold', float('inf')):
                    return f"{metric_name}_critical"
                elif value >= rule.get('warning_threshold', float('inf')):
                    return f"{metric_name}_warning"
        return None

    def _calculate_confidence(self, metric_data: Dict, context: Dict) -> float:
        """Calculate confidence score for the alert"""
        base_confidence = 0.7
        
        # Increase confidence for multiple metrics
        if len(metric_data) > 1:
            base_confidence += 0.1
        
        # Increase confidence for historical patterns
        if self._is_recurring_issue(metric_data):
            base_confidence += 0.1
        
        # Increase confidence for business context
        if context.get('business_hours', False):
            base_confidence += 0.05
        
        return min(base_confidence, 1.0)

    def _estimate_affected_users(self, metric_data: Dict, context: Dict) -> int:
        """Estimate number of users affected"""
        base_users = context.get('active_users', 100)
        
        if 'error_rate' in metric_data:
            return int(base_users * metric_data['error_rate'])
        elif 'response_time' in metric_data and metric_data['response_time'] > 2000:
            return int(base_users * 0.8)  # Assume 80% affected by slow response
        
        return int(base_users * 0.1)  # Default 10% affected

    def _estimate_duration(self, metric_data: Dict) -> str:
        """Estimate how long the issue might persist"""
        severity_durations = {
            'gpu_memory': '5-15 minutes',
            'cpu_usage': '10-30 minutes',
            'response_time': '15-45 minutes',
            'error_rate': '30-60 minutes',
            'disk_usage': '1-4 hours'
        }
        
        for metric_name in metric_data.keys():
            if metric_name in severity_durations:
                return severity_durations[metric_name]
        
        return '15-30 minutes'

    def _calculate_business_impact(self, impact_levels: Dict, context: Dict) -> float:
        """Calculate business impact score (0-1)"""
        weights = {
            'user_experience': 0.4,
            'system_stability': 0.3,
            'data_integrity': 0.2,
            'business_operations': 0.1
        }
        
        level_scores = {'low': 0.2, 'medium': 0.6, 'high': 1.0}
        
        score = sum(
            weights[category] * level_scores[level]
            for category, level in impact_levels.items()
        )
        
        # Adjust for business context
        if context.get('business_hours', False):
            score *= 1.2
        
        return min(score, 1.0)

    async def _apply_escalation_policy(self, alert: Dict) -> None:
        """Apply escalation policy for the alert"""
        severity = alert['severity']
        policy = self.escalation_policies.get(severity, {})
        
        if policy.get('immediate_notification', False):
            await self._send_immediate_notification(alert)
        
        # Schedule escalation if needed
        escalation_time = policy.get('escalation_time', 0)
        if escalation_time > 0:
            asyncio.create_task(self._schedule_escalation(alert, escalation_time))

    async def _send_immediate_notification(self, alert: Dict) -> None:
        """Send immediate notification for critical alerts"""
        logger.warning(f"IMMEDIATE ALERT: {alert['title']} - {alert['description']}")
        # Here you would integrate with notification systems (email, Slack, etc.)

    async def _schedule_escalation(self, alert: Dict, delay: int) -> None:
        """Schedule alert escalation after delay"""
        await asyncio.sleep(delay)
        logger.warning(f"ESCALATED ALERT: {alert['title']} - No resolution after {delay} seconds")
        # Here you would implement escalation logic

    def get_alert_statistics(self) -> Dict:
        """Get statistics about alerts"""
        if not self.alert_history:
            return {'total_alerts': 0}
        
        recent_alerts = [
            alert for alert in self.alert_history
            if (datetime.now() - datetime.fromisoformat(alert['timestamp'].replace('Z', '+00:00'))).days < 7
        ]
        
        severity_counts = {}
        category_counts = {}
        
        for alert in recent_alerts:
            severity = alert['severity']
            category = alert['category']
            
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            category_counts[category] = category_counts.get(category, 0) + 1
        
        return {
            'total_alerts': len(self.alert_history),
            'recent_alerts': len(recent_alerts),
            'severity_distribution': severity_counts,
            'category_distribution': category_counts,
            'average_resolution_time': self._calculate_average_resolution_time()
        }

    def _calculate_average_resolution_time(self) -> float:
        """Calculate average alert resolution time"""
        # This would be implemented with actual resolution tracking
        return 1800.0  # 30 minutes default
