/**
 * TasksSLA - Domain Entity
 *
 * Represents the task management and SLA tracking for an agency.
 * Encapsulates business logic for task priorities, overdue tracking, and workload analysis.
 *
 * @entity
 */

export class TasksSLA {
  /**
   * @param {Object} data
   * @param {Array<Object>} data.today - Tasks due today
   * @param {Array<Object>} data.overdue - Overdue tasks
   * @param {Array<Object>} data.upcoming - Upcoming tasks
   */
  constructor({ today = [], overdue = [], upcoming = [] }) {
    // Validate inputs
    if (!Array.isArray(today)) {
      throw new Error('today must be an array');
    }
    if (!Array.isArray(overdue)) {
      throw new Error('overdue must be an array');
    }
    if (!Array.isArray(upcoming)) {
      throw new Error('upcoming must be an array');
    }

    this.today = today;
    this.overdue = overdue;
    this.upcoming = upcoming;

    // Metadata
    this._calculatedAt = new Date();
    this._domainEvents = [];
  }

  /**
   * Get total number of active tasks
   * @returns {number}
   */
  getTotalActiveTasks() {
    return this.today.length + this.overdue.length + this.upcoming.length;
  }

  /**
   * Get total number of critical tasks (overdue + today)
   * @returns {number}
   */
  getCriticalTasksCount() {
    return this.overdue.length + this.today.length;
  }

  /**
   * Check if there are any overdue tasks
   * @returns {boolean}
   */
  hasOverdueTasks() {
    return this.overdue.length > 0;
  }

  /**
   * Check if workload is manageable
   * @returns {boolean}
   */
  isWorkloadManageable() {
    // Manageable if:
    // - No more than 10 overdue tasks
    // - No more than 15 tasks due today
    // - No more than 50 total active tasks
    return (
      this.overdue.length <= 10 &&
      this.today.length <= 15 &&
      this.getTotalActiveTasks() <= 50
    );
  }

  /**
   * Get workload status
   * @returns {string} 'light' | 'moderate' | 'heavy' | 'critical'
   */
  getWorkloadStatus() {
    const total = this.getTotalActiveTasks();
    const overdueCount = this.overdue.length;

    // Critical if many overdue tasks
    if (overdueCount > 15) return 'critical';
    if (overdueCount > 10) return 'heavy';

    // Based on total workload
    if (total === 0) return 'light';
    if (total <= 10) return 'light';
    if (total <= 30) return 'moderate';
    if (total <= 50) return 'heavy';
    return 'critical';
  }

  /**
   * Get priority distribution
   * @returns {Object} { high: number, medium: number, low: number }
   */
  getPriorityDistribution() {
    const allTasks = [...this.today, ...this.overdue, ...this.upcoming];

    return {
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    };
  }

  /**
   * Get most overdue task
   * @returns {Object|null} Task with earliest due date
   */
  getMostOverdueTask() {
    if (this.overdue.length === 0) return null;

    return this.overdue.reduce((earliest, current) => {
      const earliestDate = new Date(earliest.due_date);
      const currentDate = new Date(current.due_date);
      return currentDate < earliestDate ? current : earliest;
    });
  }

  /**
   * Get average days overdue for overdue tasks
   * @returns {number} Average days overdue (0 if no overdue tasks)
   */
  getAverageDaysOverdue() {
    if (this.overdue.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDaysOverdue = this.overdue.reduce((sum, task) => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return sum + daysOverdue;
    }, 0);

    return Math.round(totalDaysOverdue / this.overdue.length);
  }

  /**
   * Get tasks by assignee
   * @returns {Object} Map of assignee to task count
   */
  getTasksByAssignee() {
    const allTasks = [...this.today, ...this.overdue, ...this.upcoming];
    const assigneeMap = {};

    allTasks.forEach(task => {
      const assigneeName = task.assignee?.name || 'Unassigned';
      assigneeMap[assigneeName] = (assigneeMap[assigneeName] || 0) + 1;
    });

    return assigneeMap;
  }

  /**
   * Check if any team member is overloaded
   * @returns {boolean}
   */
  hasOverloadedAssignees() {
    const tasksByAssignee = this.getTasksByAssignee();
    return Object.values(tasksByAssignee).some(count => count > 15);
  }

  /**
   * Get actionable insights for task management
   * @returns {Array<string>} Array of recommendation messages
   */
  getInsights() {
    const insights = [];

    // No tasks
    if (this.getTotalActiveTasks() === 0) {
      insights.push('No active tasks - you\'re all caught up!');
      return insights;
    }

    // Overdue tasks
    if (this.overdue.length > 0) {
      const avgDaysOverdue = this.getAverageDaysOverdue();
      const mostOverdue = this.getMostOverdueTask();

      if (this.overdue.length > 10) {
        insights.push(`${this.overdue.length} tasks overdue - prioritize clearing backlog`);
      } else {
        insights.push(`${this.overdue.length} task(s) overdue - address these first`);
      }

      if (avgDaysOverdue > 7) {
        insights.push(`Tasks are ${avgDaysOverdue} days overdue on average - review priorities`);
      }

      if (mostOverdue) {
        const daysOverdue = Math.floor(
          (new Date() - new Date(mostOverdue.due_date)) / (1000 * 60 * 60 * 24)
        );
        if (daysOverdue > 14) {
          insights.push(`Oldest task is ${daysOverdue} days overdue - escalate if needed`);
        }
      }
    }

    // Today's tasks
    if (this.today.length > 10) {
      insights.push(`${this.today.length} tasks due today - consider delegating or rescheduling some`);
    } else if (this.today.length > 0) {
      insights.push(`${this.today.length} task(s) due today - stay focused!`);
    }

    // Workload distribution
    if (this.hasOverloadedAssignees()) {
      insights.push('Some team members have heavy workloads - consider redistributing tasks');
    }

    // Priority distribution
    const priorities = this.getPriorityDistribution();
    if (priorities.high > priorities.medium + priorities.low) {
      insights.push('Many high-priority tasks - review if all are truly urgent');
    }

    // Upcoming workload
    if (this.upcoming.length > 30) {
      insights.push(`${this.upcoming.length} upcoming tasks - plan ahead to avoid future backlog`);
    }

    // Positive feedback
    if (insights.length === 0 && this.isWorkloadManageable()) {
      insights.push('Workload is well-managed - great job!');
    }

    return insights;
  }

  /**
   * Get SLA metrics
   * @returns {Object} SLA performance metrics
   */
  getSLAMetrics() {
    const total = this.getTotalActiveTasks();
    const onTime = this.upcoming.length + this.today.length;
    const late = this.overdue.length;

    return {
      total,
      onTime,
      late,
      onTimePercentage: total === 0 ? 100 : Math.round((onTime / total) * 100),
      latePercentage: total === 0 ? 0 : Math.round((late / total) * 100),
      averageDaysOverdue: this.getAverageDaysOverdue()
    };
  }

  /**
   * Convert to Data Transfer Object for API responses
   * @returns {Object} Safe object for API responses
   */
  toDTO() {
    return {
      // Task lists
      today: this.today,
      overdue: this.overdue,
      upcoming: this.upcoming,

      // Counts
      totalActiveTasks: this.getTotalActiveTasks(),
      criticalTasksCount: this.getCriticalTasksCount(),

      // Status
      workloadStatus: this.getWorkloadStatus(),
      isWorkloadManageable: this.isWorkloadManageable(),
      hasOverdueTasks: this.hasOverdueTasks(),

      // Analysis
      priorityDistribution: this.getPriorityDistribution(),
      tasksByAssignee: this.getTasksByAssignee(),
      slaMetrics: this.getSLAMetrics(),
      mostOverdueTask: this.getMostOverdueTask(),
      insights: this.getInsights(),

      // Metadata
      calculatedAt: this._calculatedAt.toISOString()
    };
  }

  /**
   * Record domain event for viewed tasks
   * @param {string} agencyId
   * @param {string} userId
   */
  recordViewed(agencyId, userId) {
    this._domainEvents.push({
      type: 'TasksSLAViewed',
      agencyId,
      userId,
      data: {
        totalTasks: this.getTotalActiveTasks(),
        overdueCount: this.overdue.length,
        workloadStatus: this.getWorkloadStatus()
      },
      occurredAt: new Date()
    });
  }

  /**
   * Pull domain events (for event publishing)
   * @returns {Array} Domain events
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
