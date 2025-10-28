/**
 * AgencyDashboardRepository - Port (Interface)
 *
 * Defines the contract for agency dashboard data access.
 * Implementations (adapters) must provide concrete implementations.
 *
 * @port Infrastructure
 */

export class AgencyDashboardRepository {
  /**
   * Get Key Performance Indicators for an agency
   * @param {string} agencyId - The agency ID
   * @returns {Promise<Object>} Raw KPI data
   * @throws {Error} If not implemented
   */
  async getKPIs(agencyId) {
    throw new Error('AgencyDashboardRepository.getKPIs() must be implemented by adapter');
  }

  /**
   * Get alerts for an agency
   * @param {string} agencyId - The agency ID
   * @returns {Promise<Array<Object>>} Raw alert data
   * @throws {Error} If not implemented
   */
  async getAlerts(agencyId) {
    throw new Error('AgencyDashboardRepository.getAlerts() must be implemented by adapter');
  }

  /**
   * Get pipeline funnel metrics
   * @param {string} agencyId - The agency ID
   * @param {number} dateRange - Days to look back
   * @returns {Promise<Object>} Pipeline data
   * @throws {Error} If not implemented
   */
  async getPipelineFunnel(agencyId, dateRange = 30) {
    throw new Error('AgencyDashboardRepository.getPipelineFunnel() must be implemented by adapter');
  }

  /**
   * Get time-to-hire trend data
   * @param {string} agencyId - The agency ID
   * @param {Array<string>} periods - Period identifiers (e.g., ['7d', '30d', '90d'])
   * @returns {Promise<Object>} Time-to-hire data
   * @throws {Error} If not implemented
   */
  async getTimeToHireTrend(agencyId, periods = ['7d', '30d', '90d']) {
    throw new Error('AgencyDashboardRepository.getTimeToHireTrend() must be implemented by adapter');
  }

  /**
   * Get tasks with SLA tracking
   * @param {string} agencyId - The agency ID
   * @returns {Promise<Object>} Tasks organized by SLA status
   * @throws {Error} If not implemented
   */
  async getTasksSLA(agencyId) {
    throw new Error('AgencyDashboardRepository.getTasksSLA() must be implemented by adapter');
  }

  /**
   * Get subscription status
   * @param {string} agencyId - The agency ID
   * @returns {Promise<Object>} Subscription data
   * @throws {Error} If not implemented
   */
  async getSubscriptionStatus(agencyId) {
    throw new Error('AgencyDashboardRepository.getSubscriptionStatus() must be implemented by adapter');
  }
}
