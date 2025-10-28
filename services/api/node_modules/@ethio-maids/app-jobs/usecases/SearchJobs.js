/**
 * SearchJobs Use Case (Query)
 *
 * Search and filter job postings.
 */

export class SearchJobs {
  constructor({ jobRepository }) {
    this.jobRepository = jobRepository;
  }

  async execute(query) {
    // 1. Build filters
    const filters = {
      skills: query.skills || [],
      languages: query.languages || [],
      countries: query.countries || [],
      cities: query.cities || [],
      accommodationType: query.accommodationType,
      minSalary: query.minSalary ? parseFloat(query.minSalary) : null,
      maxSalary: query.maxSalary ? parseFloat(query.maxSalary) : null,
      currency: query.currency || 'AED',
      status: query.status || 'open', // Default to open jobs
    };

    // 2. Build pagination
    const pagination = {
      page: Math.max(1, query.page || 1),
      limit: Math.min(100, Math.max(1, query.limit || 20)),
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // 3. Execute search
    const result = await this.jobRepository.search(filters, pagination);

    // 4. Return results
    return {
      jobs: result.jobs.map(job => job.toJSON()),
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.total / pagination.limit),
    };
  }
}
