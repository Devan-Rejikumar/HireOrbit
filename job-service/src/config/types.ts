const TYPES = {
  JobService: Symbol.for('JobService'),
  IJobService: Symbol.for('IJobService'),
  JobRepository: Symbol.for('JobRepository'),
  IJobRepository: Symbol.for('IJobRepository'),
  JobController: Symbol.for('JobController'),
  JobReportService: Symbol.for('JobReportService'),
  IJobReportService: Symbol.for('IJobReportService'),
  JobReportRepository: Symbol.for('JobReportRepository'),
  IJobReportRepository: Symbol.for('IJobReportRepository'),
  JobReportController: Symbol.for('JobReportController'),
  SubscriptionValidationService: Symbol.for('SubscriptionValidationService'),
  JobUnlistCronService: Symbol.for('JobUnlistCronService'),
};

export default TYPES;
