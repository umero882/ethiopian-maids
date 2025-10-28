/**
 * ApplicationRepository Port (Interface)
 *
 * Defines the contract for job application data access.
 */

export class ApplicationRepository {
  async findById(id) {
    throw new Error('ApplicationRepository.findById() not implemented');
  }

  async findByJobId(jobId, pagination) {
    throw new Error('ApplicationRepository.findByJobId() not implemented');
  }

  async findByMaidId(maidId, pagination) {
    throw new Error('ApplicationRepository.findByMaidId() not implemented');
  }

  async findBySponsorId(sponsorId, pagination) {
    throw new Error('ApplicationRepository.findBySponsorId() not implemented');
  }

  async save(application) {
    throw new Error('ApplicationRepository.save() not implemented');
  }

  async delete(id) {
    throw new Error('ApplicationRepository.delete() not implemented');
  }

  async countActiveApplicationsByMaid(maidId) {
    throw new Error('ApplicationRepository.countActiveApplicationsByMaid() not implemented');
  }

  async existsForMaidAndJob(maidId, jobId) {
    throw new Error('ApplicationRepository.existsForMaidAndJob() not implemented');
  }
}
