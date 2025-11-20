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
};

export default TYPES;