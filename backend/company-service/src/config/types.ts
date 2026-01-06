const TYPES = {
  CompanyService: Symbol.for('CompanyService'),
  ICompanyService: Symbol.for('ICompanyService'),
  CompanyRepository: Symbol.for('CompanyRepository'),
  ICompanyRepository: Symbol.for('ICompanyRepository'),
  EmailService: Symbol.for('EmailService'),
  RedisService: Symbol.for('RedisService'),
  CompanyAuthController: Symbol.for('CompanyAuthController'),
  CompanyProfileController: Symbol.for('CompanyProfileController'),
  CompanyAdminController: Symbol.for('CompanyAdminController'),
  CookieService: Symbol.for('CookieService'),
  IndustryCategoryRepository: Symbol.for('IndustryCategoryRepository'),
  IIndustryCategoryRepository: Symbol.for('IIndustryCategoryRepository'),
  IndustryCategoryService: Symbol.for('IndustryCategoryService'),
  IIndustryCategoryService: Symbol.for('IIndustryCategoryService'),
  IndustryCategoryController: Symbol.for('IndustryCategoryController'),
  JobServiceClient: Symbol.for('JobServiceClient'),
};

export default TYPES;