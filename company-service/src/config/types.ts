const TYPES = {
  CompanyService: Symbol.for('CompanyService'),
  ICompanyService:Symbol.for('ICompanyService'),
  CompanyRepository: Symbol.for('CompanyRepository'),
  ICompanyRepository:Symbol.for('ICompanyRepository'),
  EmailService: Symbol.for('EmailService'),
  RedisService: Symbol.for('RedisService'),
  CompanyController: Symbol.for('CompanyController'),

};
  
export default TYPES;