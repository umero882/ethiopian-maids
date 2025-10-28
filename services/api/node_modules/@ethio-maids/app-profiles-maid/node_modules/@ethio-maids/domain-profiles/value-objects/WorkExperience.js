/**
 * WorkExperience Value Object
 *
 * Immutable representation of a maid's work experience entry.
 */

export class WorkExperience {
  constructor(props) {
    this._validate(props);

    this.country = props.country;
    this.jobTitle = props.jobTitle;
    this.duties = props.duties || [];
    this.startDate = new Date(props.startDate);
    this.endDate = props.endDate ? new Date(props.endDate) : null;
    this.isCurrentJob = props.isCurrentJob || false;
    this.reference = props.reference || null; // { name, phone, email }
  }

  /**
   * Validate props
   */
  _validate(props) {
    if (!props.country) {
      throw new Error('Country is required for work experience');
    }
    if (!props.jobTitle) {
      throw new Error('Job title is required for work experience');
    }
    if (!props.startDate) {
      throw new Error('Start date is required for work experience');
    }

    const start = new Date(props.startDate);
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date');
    }

    if (props.endDate) {
      const end = new Date(props.endDate);
      if (isNaN(end.getTime())) {
        throw new Error('Invalid end date');
      }
      if (end < start) {
        throw new Error('End date must be after start date');
      }
    }
  }

  /**
   * Calculate duration in months
   */
  getDurationInMonths() {
    const end = this.endDate || new Date();
    const months = (end.getFullYear() - this.startDate.getFullYear()) * 12 +
                   (end.getMonth() - this.startDate.getMonth());
    return Math.max(0, months);
  }

  /**
   * Format duration for display
   */
  formatDuration() {
    const months = this.getDurationInMonths();
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }

    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }

    return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  /**
   * Check if experience overlaps with another
   */
  overlapsWith(other) {
    if (!(other instanceof WorkExperience)) return false;

    const thisEnd = this.endDate || new Date();
    const otherEnd = other.endDate || new Date();

    return this.startDate <= otherEnd && thisEnd >= other.startDate;
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      country: this.country,
      jobTitle: this.jobTitle,
      duties: this.duties,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate ? this.endDate.toISOString() : null,
      isCurrentJob: this.isCurrentJob,
      reference: this.reference,
      durationInMonths: this.getDurationInMonths(),
    };
  }

  /**
   * Value equality
   */
  equals(other) {
    if (!(other instanceof WorkExperience)) return false;

    return this.country === other.country &&
           this.jobTitle === other.jobTitle &&
           this.startDate.getTime() === other.startDate.getTime() &&
           (this.endDate?.getTime() || null) === (other.endDate?.getTime() || null);
  }
}
