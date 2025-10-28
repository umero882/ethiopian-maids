/**
 * JobRepository Port (Interface)
 *
 * Defines the contract for job posting data access.
 */

export class JobRepository {
  async findById(id) {
    throw new Error('JobRepository.findById() not implemented');
  }

  async findBySponsorId(sponsorId, pagination) {
    throw new Error('JobRepository.findBySponsorId() not implemented');
  }

  async search(filters, pagination) {
    throw new Error('JobRepository.search() not implemented');
  }

  async save(jobPosting) {
    throw new Error('JobRepository.save() not implemented');
  }

  async delete(id) {
    throw new Error('JobRepository.delete() not implemented');
  }

  async findExpiredJobs() {
    throw new Error('JobRepository.findExpiredJobs() not implemented');
  }
}
