
export interface ManualSection {
  id: string;
  title: string;
  content: string;
  subsections?: { id: string; title: string; content: string }[];
}

export const MANNUAL_METADATA = {
  company: "Vezloo",
  documentNo: "M/01",
  revisionNo: "01",
  updateDate: "01/01/2020",
  preparedBy: "Manager",
  approvedBy: "Manager",
};

export const MANUAL_CONTENT: ManualSection[] = [
  {
    id: "introduction",
    title: "1. VEZLOO INTRODUCTION",
    content: "At Vezloo, we are committed to delivering world-class Business Process Outsourcing (BPO) services with a focus on AI data annotation, data labeling, sports analytics, video detection, generative AI support, gaming, and transcription.\n\nThis Quality Policy applies to all services provided by Vezloo and forms the foundation of our Quality Management System (QMS). Our mission is to empower our clients with accurate, high-quality, and timely data solutions that enhance their business performance and technological innovation.",
    subsections: [
      {
        id: "authorization-statement",
        title: "1.1 AUTHORIZATION STATEMENT",
        content: "Vezloo is fully committed to the establishment and maintenance of a Quality Management System as described in this manual and implemented by the organization to meet the requirements of ISO 9001:2015.\n\nAll personnel of Vezloo shall strictly adhere to the quality policies and procedures as addressed or referred to in this manual.\n\nThe QMS Team Leader has been appointed and is responsible for ensuring compliance with the Quality requirements stipulated in this manual. The QMS Team Leader is authorized to ensure that the quality system is established, implemented, and maintained throughout the organization. Top Management gives full support and cooperation to the QMS Team Leader and ensures that all Heads of Departments (HODs) implement the system effectively."
      },
      {
        id: "organization-structure",
        title: "1.2 ORGANIZATION STRUCTURE",
        content: "The organizational structure of Vezloo is defined to ensure clear lines of authority and communication across all departments. The structure supports effective decision-making and accountability at all levels. Detailed organizational charts are maintained separately in the QMS documentation files."
      }
    ]
  },
  {
    id: "applicability",
    title: "2. APPLICABILITY",
    content: "This manual applies to all activities, processes, services, and operations performed by Vezloo. The organization provides Business Process Outsourcing (BPO) services with specialization in:\n- AI data annotation and data labeling\n- Sports analytics\n- Video detection and analysis\n- Generative AI support\n- Gaming support services\n- Transcription services",
    subsections: [
      {
        id: "scope",
        title: "2.1 SCOPE OF QUALITY MANAGEMENT SYSTEM",
        content: "The scope of certification under ISO 9001:2015 for Vezloo is defined as:\n\n\"Provision of Business Process Outsourcing (BPO) services including AI data annotation, data labeling, sports analytics, video detection, generative AI support, gaming, and transcription services.\"\n\nThis scope covers all core service delivery processes, customer-facing operations, and supporting functions within the organization."
      },
      {
        id: "operational-area",
        title: "2.2 OPERATIONAL AREA & PRODUCTION SITE(S)",
        content: "Head Office: Cairo, Egypt\nOperational Sites: Remote operations are performed by distributed teams under centralized quality oversight and management controls."
      },
      {
        id: "exclusions",
        title: "2.3 PERMISSIBLE EXCLUSION(S)",
        content: "Based on the nature of the organization and its activities, the following requirements of ISO 9001:2015 are not applicable to Vezloo:\n\nClause 8.3 – Design and Development of Products and Services\nJustification: Vezloo provides services based on client specifications and does not engage in the design and development of new products or services. All service delivery follows established client requirements and industry standards."
      }
    ]
  },
  {
    id: "terms-definitions",
    title: "3. TERMS AND DEFINITIONS",
    content: "Key terms used in this Quality Management System:\n\n- QMS: Quality Management System – a formalized system documenting processes, procedures, and responsibilities for achieving quality policies and objectives.\n- Top Management: Person or group who directs and controls the organization at the highest level.\n- NCR: Non-Conformity Report – a document recording a deviation from specified requirements.\n- CAR: Corrective Action Report – a document recording corrective actions taken to eliminate the cause of a detected nonconformity.\n- CAPA: Corrective and Preventive Action – systematic approach to investigating, understanding, and correcting discrepancies.\n- Audit: Systematic, independent, and documented process for obtaining audit evidence and evaluating it objectively.\n- Risk: Effect of uncertainty on objectives (can be positive or negative).\n- Traceability: Ability to follow the history, application, or location of an object through recorded identification.\n- KPI: Key Performance Indicator – a measurable value demonstrating how effectively objectives are being achieved.\n- SOP: Standard Operating Procedure – a set of step-by-step instructions for routine operations.\n- Interested Party (Stakeholder): Person or organization that can affect, be affected by, or perceive itself to be affected by a decision or activity."
  },
  {
    id: "context",
    title: "4. CONTEXT OF THE ORGANIZATION",
    content: "Vezloo has identified internal and external issues that may affect its ability to achieve the intended results of the QMS. These issues are reviewed periodically to ensure continued relevance and alignment with organizational strategy.",
    subsections: [
      {
        id: "understanding-context",
        title: "4.1 UNDERSTANDING THE ORGANIZATION AND ITS CONTEXT",
        content: "Vezloo monitors and reviews information about internal and external issues relevant to its purpose and strategic direction:\n\nInternal Issues:\n- Organizational culture and knowledge management\n- IT infrastructure and technology capabilities\n- Employee competence, training, and retention\n- Resource availability and allocation\n- Internal process efficiency and performance\n\nExternal Issues:\n- Data security and privacy regulations (e.g., GDPR, local data protection laws)\n- Rapid technological advancements in AI and automation\n- Competitive landscape in the BPO industry\n- Client expectations and market trends\n- Economic and geopolitical factors affecting operations"
      },
      {
        id: "interested-parties",
        title: "4.2 UNDERSTANDING THE NEEDS AND EXPECTATIONS OF INTERESTED PARTIES",
        content: "Vezloo has identified the following interested parties relevant to the QMS:\n\n- Customers: Expect high-quality, accurate, and timely service delivery with data security.\n- Employees: Expect fair treatment, career development, safe working environment, and clear communication.\n- Regulatory Bodies: Expect compliance with applicable laws, regulations, and industry standards.\n- Suppliers & Partners: Expect clear specifications, timely payments, and mutually beneficial relationships.\n- Shareholders/Owners: Expect sustainable growth, profitability, and effective risk management.\n\nTheir needs are monitored via customer surveys, contract reviews, employee feedback, regulatory updates, and regular management meetings."
      },
      {
        id: "determining-scope",
        title: "4.3 DETERMINING THE SCOPE OF THE QUALITY MANAGEMENT SYSTEM",
        content: "The scope of the QMS has been determined considering:\n- External and internal issues identified in Clause 4.1\n- Requirements of interested parties identified in Clause 4.2\n- The services provided by Vezloo\n\nThe QMS scope is documented and available as documented information. The exclusion of Clause 8.3 (Design and Development) does not affect Vezloo's ability or responsibility to ensure conformity of its services."
      },
      {
        id: "qms-processes",
        title: "4.4 QUALITY MANAGEMENT SYSTEM AND ITS PROCESSES",
        content: "Vezloo has established, implemented, maintained, and continually improves its QMS, including the processes needed and their interactions, in accordance with the requirements of ISO 9001:2015.\n\nFor each process, Vezloo has determined:\n- Required inputs and expected outputs\n- Sequence and interaction of processes\n- Criteria and methods for effective operation and control\n- Resources needed and their availability\n- Responsibilities and authorities\n- Risks and opportunities as identified in Clause 6.1\n- Methods for monitoring, measuring, and evaluating processes\n- Opportunities for improvement\n\nA Process Interaction Map is maintained to show the relationship between core, support, and management processes."
      }
    ]
  },
  {
    id: "leadership",
    title: "5. LEADERSHIP",
    content: "Top Management of Vezloo demonstrates leadership and commitment with respect to the Quality Management System to ensure its effectiveness and alignment with the strategic direction of the organization.",
    subsections: [
      {
        id: "leadership-commitment",
        title: "5.1 LEADERSHIP AND COMMITMENT",
        content: "Top Management demonstrates leadership and commitment by:\n- Taking accountability for the effectiveness of the QMS\n- Ensuring the Quality Policy and Quality Objectives are established and compatible with the context and strategic direction of Vezloo\n- Ensuring integration of QMS requirements into business processes\n- Promoting the use of the process approach and risk-based thinking\n- Ensuring resources needed for the QMS are available\n- Communicating the importance of effective quality management and conforming to QMS requirements\n- Directing and supporting persons to contribute to the effectiveness of the QMS\n- Promoting continual improvement\n- Supporting other relevant management roles to demonstrate their leadership"
      },
      {
        id: "customer-focus",
        title: "5.1.2 CUSTOMER FOCUS",
        content: "Top Management ensures that customer focus is maintained by:\n- Determining, understanding, and consistently meeting customer requirements and applicable statutory and regulatory requirements\n- Identifying and addressing risks and opportunities that can affect conformity of services and customer satisfaction\n- Maintaining focus on enhancing customer satisfaction through reliable and consistent service delivery\n- Regularly reviewing customer feedback, complaints, and satisfaction survey results"
      },
      {
        id: "policy",
        title: "5.2 QUALITY POLICY",
        content: "The Quality Policy of Vezloo:\n- Is appropriate to the purpose and context of the organization and supports its strategic direction\n- Provides a framework for setting quality objectives\n- Includes a commitment to satisfy applicable requirements\n- Includes a commitment to continual improvement of the QMS\n\nThe Quality Policy is communicated to all employees, is available to interested parties, and is reviewed periodically for continuing suitability. The full Quality Policy statement is documented in Annex 1 of this manual."
      },
      {
        id: "roles-responsibilities",
        title: "5.3 ORGANIZATIONAL ROLES, RESPONSIBILITIES AND AUTHORITIES",
        content: "Top Management ensures that the responsibilities and authorities for relevant roles are assigned, communicated, and understood within Vezloo.\n\nKey assignments include:\n- QMS Team Leader: Responsible for ensuring the QMS conforms to ISO 9001:2015 requirements, reporting on QMS performance, ensuring promotion of customer focus, and maintaining system integrity during changes.\n- Heads of Departments (HODs): Responsible for implementing QMS requirements within their departments, ensuring process outputs are delivered as planned, and reporting on process performance.\n- All Employees: Responsible for adhering to documented procedures, reporting nonconformities, and contributing to continual improvement."
      }
    ]
  },
  {
    id: "planning",
    title: "6. PLANNING",
    content: "Vezloo plans actions to address risks and opportunities, establishes quality objectives, and plans changes to ensure the QMS achieves its intended results.",
    subsections: [
      {
        id: "risks-opportunities",
        title: "6.1 ACTIONS TO ADDRESS RISKS AND OPPORTUNITIES",
        content: "When planning for the QMS, Vezloo considers the issues referred to in Clause 4.1 and the requirements referred to in Clause 4.2 to determine risks and opportunities that need to be addressed to:\n- Give assurance that the QMS can achieve its intended results\n- Enhance desirable effects\n- Prevent or reduce undesired effects\n- Achieve continual improvement\n\nVezloo plans actions to address these risks and opportunities, integrates and implements them into QMS processes, and evaluates their effectiveness. A Risk and Opportunity Analysis Sheet is maintained and reviewed periodically."
      },
      {
        id: "objectives",
        title: "6.2 QUALITY OBJECTIVES AND PLANNING TO ACHIEVE THEM",
        content: "Vezloo establishes quality objectives at relevant functions, levels, and processes needed for the QMS. Quality objectives:\n- Are consistent with the Quality Policy\n- Are measurable and take into account applicable requirements\n- Are relevant to conformity of services and enhancement of customer satisfaction\n- Are monitored, communicated, and updated as appropriate\n\nWhen planning how to achieve quality objectives, Vezloo determines what will be done, what resources are required, who will be responsible, when it will be completed, and how results will be evaluated."
      },
      {
        id: "planning-changes",
        title: "6.3 PLANNING OF CHANGES",
        content: "When Vezloo determines the need for changes to the QMS, the changes are carried out in a planned manner considering:\n- The purpose of the changes and their potential consequences\n- The integrity of the QMS\n- The availability of resources\n- The allocation or reallocation of responsibilities and authorities"
      }
    ]
  },
  {
    id: "support",
    title: "7. SUPPORT",
    content: "Vezloo determines and provides the resources, competence, awareness, communication, and documented information needed for the establishment, implementation, maintenance, and continual improvement of the QMS.",
    subsections: [
      {
        id: "resources",
        title: "7.1 RESOURCES",
        content: "Vezloo determines and provides resources needed for the QMS, including:\n\n7.1.1 General: Considering the capabilities and constraints of existing resources, and what needs to be obtained from external providers.\n\n7.1.2 People: Determining and providing the persons necessary for effective implementation of the QMS and operation of its processes.\n\n7.1.3 Infrastructure: Maintaining the infrastructure necessary for the operation of processes, including buildings, IT equipment, hardware, software, and communication technology.\n\n7.1.4 Environment for the Operation of Processes: Providing and maintaining a suitable work environment, considering social, psychological, and physical factors.\n\n7.1.5 Monitoring and Measuring Resources: Ensuring suitable resources are available for valid and reliable monitoring and measurement results. Where applicable, equipment is calibrated or verified against traceable standards.\n\n7.1.6 Organizational Knowledge: Determining the knowledge necessary for the operation of processes and achieving service conformity, including lessons learned, industry knowledge, and best practices."
      },
      {
        id: "competence-awareness",
        title: "7.2 & 7.3 COMPETENCE AND AWARENESS",
        content: "7.2 COMPETENCE\nVezloo ensures that persons performing work affecting QMS performance are competent on the basis of appropriate education, training, or experience. Where applicable, actions are taken to acquire the necessary competence, and their effectiveness is evaluated. Records of competence are retained.\n\n7.3 AWARENESS\nAll persons doing work under Vezloo's control are made aware of:\n- The Quality Policy\n- Relevant quality objectives\n- Their contribution to the effectiveness of the QMS, including the benefits of improved performance\n- The implications of not conforming to QMS requirements"
      },
      {
        id: "communication",
        title: "7.4 COMMUNICATION",
        content: "Vezloo determines the internal and external communications relevant to the QMS, including:\n- What to communicate\n- When to communicate\n- With whom to communicate\n- How to communicate\n- Who communicates\n\nCommunication channels include email, meetings, notice boards, training sessions, and management review meetings."
      },
      {
        id: "documented-info",
        title: "7.5 DOCUMENTED INFORMATION",
        content: "Vezloo's QMS includes documented information required by ISO 9001:2015 and determined by the organization as necessary for the effectiveness of the QMS.\n\n7.5.1 Creating and Updating: When creating and updating documented information, Vezloo ensures appropriate identification, description, format, media, and review/approval for suitability and adequacy.\n\n7.5.2 Control of Documented Information: Documented information is controlled to ensure it is available and suitable for use where and when needed, and is adequately protected against loss of confidentiality, improper use, or loss of integrity. Controls include distribution, access, retrieval, use, storage, preservation, control of changes, retention, and disposition."
      }
    ]
  },
  {
    id: "operation",
    title: "8. OPERATION",
    content: "Vezloo plans, implements, and controls the processes needed to meet the requirements for the provision of services, and to implement the actions determined in Clause 6.1.",
    subsections: [
      {
        id: "op-planning",
        title: "8.1 OPERATIONAL PLANNING AND CONTROL",
        content: "Vezloo plans and controls its operations by:\n- Determining the requirements for services\n- Establishing criteria for processes and for acceptance of services\n- Determining the resources needed to achieve conformity\n- Implementing control of the processes in accordance with the criteria\n- Determining, maintaining, and retaining documented information to demonstrate that processes have been carried out as planned and to demonstrate conformity of services to requirements"
      },
      {
        id: "req-products",
        title: "8.2 REQUIREMENTS FOR PRODUCTS AND SERVICES",
        content: "8.2.1 Customer Communication: Vezloo establishes effective communication with customers regarding service information, enquiries, contracts, feedback, complaints, and handling of customer property.\n\n8.2.2 Determining Requirements: Requirements for services are defined, including applicable statutory and regulatory requirements and those considered necessary by Vezloo.\n\n8.2.3 Review of Requirements: Before committing to supply services, Vezloo conducts a review to ensure that requirements are defined, any differences between previously expressed requirements are resolved, and the organization has the ability to meet the defined requirements."
      },
      {
        id: "control-ext",
        title: "8.4 CONTROL OF EXTERNALLY PROVIDED PROCESSES, PRODUCTS AND SERVICES",
        content: "Vezloo ensures that externally provided processes, products, and services conform to requirements. Controls are applied when:\n- Products and services from external providers are intended for incorporation into Vezloo's own services\n- Products and services are provided directly to the customer(s) by external providers on behalf of Vezloo\n- A process or part of a process is provided by an external provider as a result of a decision by Vezloo\n\nThe type and extent of control applied to external providers is based on their effect on Vezloo's ability to consistently deliver conforming services to customers."
      },
      {
        id: "production-service",
        title: "8.5 PRODUCTION AND SERVICE PROVISION",
        content: "Vezloo implements service provision under controlled conditions, including:\n- The availability of documented information that defines the characteristics of services and activities to be performed\n- The availability and use of suitable monitoring and measuring resources\n- The implementation of monitoring and measurement activities at appropriate stages\n- The use of suitable infrastructure and environment for the operation of processes\n- The appointment of competent persons, including any required qualification\n- The implementation of actions to prevent human error\n- The implementation of release, delivery, and post-delivery activities\n\nVezloo uses suitable means to identify outputs when necessary to ensure conformity, and maintains traceability where required by clients."
      },
      {
        id: "release-nonconforming",
        title: "8.6 & 8.7 RELEASE OF SERVICES AND CONTROL OF NONCONFORMING OUTPUTS",
        content: "8.6 Release of Services: Vezloo implements planned arrangements at appropriate stages to verify that the service requirements have been met. Release of services to the customer does not proceed until the planned arrangements have been satisfactorily completed, unless otherwise approved by a relevant authority or the customer.\n\n8.7 Control of Nonconforming Outputs: Vezloo ensures that outputs that do not conform to their requirements are identified and controlled to prevent their unintended use or delivery. Appropriate actions are taken based on the nature of the nonconformity and its effect on the conformity of services. Documented information is retained describing the nonconformity, actions taken, concessions obtained, and the authority deciding the action."
      }
    ]
  },
  {
    id: "evaluation",
    title: "9. PERFORMANCE EVALUATION",
    content: "Vezloo determines what needs to be monitored and measured, the methods for monitoring, measurement, analysis, and evaluation, when monitoring and measuring shall be performed, and when results shall be analyzed and evaluated.",
    subsections: [
      {
        id: "monitoring-analysis",
        title: "9.1 MONITORING, MEASUREMENT, ANALYSIS AND EVALUATION",
        content: "9.1.1 General: Vezloo evaluates the performance and effectiveness of the QMS, retaining appropriate documented information as evidence of the results.\n\n9.1.2 Customer Satisfaction: Vezloo monitors customers' perceptions of the degree to which their needs and expectations have been fulfilled. Methods for obtaining, monitoring, and reviewing this information include customer surveys, feedback on delivered services, client meetings, compliments, claims, and dealer reports.\n\n9.1.3 Analysis and Evaluation: Vezloo analyzes and evaluates appropriate data and information arising from monitoring and measurement to assess conformity of services, the degree of customer satisfaction, QMS performance and effectiveness, whether planning has been implemented effectively, the effectiveness of actions taken to address risks and opportunities, the performance of external providers, and the need for improvements to the QMS."
      },
      {
        id: "internal-audit",
        title: "9.2 INTERNAL AUDIT",
        content: "Vezloo conducts internal audits at planned intervals to provide information on whether the QMS:\n- Conforms to Vezloo's own requirements for its QMS\n- Conforms to the requirements of ISO 9001:2015\n- Is effectively implemented and maintained\n\nVezloo plans, establishes, implements, and maintains an audit program including the frequency, methods, responsibilities, planning requirements, and reporting. Audit criteria and scope are defined for each audit. Auditors are selected to ensure objectivity and impartiality. Audit results are reported to relevant management, and corrections and corrective actions are taken without undue delay."
      },
      {
        id: "management-review",
        title: "9.3 MANAGEMENT REVIEW",
        content: "Top Management reviews Vezloo's QMS at planned intervals to ensure its continuing suitability, adequacy, effectiveness, and alignment with the strategic direction of the organization.\n\nManagement review inputs include:\n- Status of actions from previous management reviews\n- Changes in external and internal issues relevant to the QMS\n- Information on QMS performance and effectiveness (customer satisfaction, quality objectives, process performance, nonconformities and corrective actions, monitoring and measurement results, audit results, external provider performance)\n- Adequacy of resources\n- Effectiveness of actions taken to address risks and opportunities\n- Opportunities for improvement\n\nManagement review outputs include decisions and actions related to opportunities for improvement, any need for changes to the QMS, and resource needs."
      }
    ]
  },
  {
    id: "improvement",
    title: "10. IMPROVEMENT",
    content: "Vezloo determines and selects opportunities for improvement and implements necessary actions to meet customer requirements and enhance customer satisfaction.",
    subsections: [
      {
        id: "general-improvement",
        title: "10.1 GENERAL",
        content: "Improvements include improving services to meet requirements as well as to address future needs and expectations, correcting, preventing, or reducing undesired effects, and improving the performance and effectiveness of the QMS."
      },
      {
        id: "nonconformity",
        title: "10.2 NONCONFORMITY AND CORRECTIVE ACTION",
        content: "When a nonconformity occurs, including any arising from complaints, Vezloo:\n- Reacts to the nonconformity by taking action to control and correct it, and dealing with the consequences\n- Evaluates the need for action to eliminate the cause(s) of the nonconformity so that it does not recur or occur elsewhere, by reviewing and analyzing the nonconformity, determining the causes, and determining if similar nonconformities exist or could potentially occur\n- Implements any action needed\n- Reviews the effectiveness of any corrective action taken\n- Updates risks and opportunities determined during planning, if necessary\n- Makes changes to the QMS, if necessary\n\nCorrective actions are appropriate to the effects of the nonconformities encountered. Documented information is retained as evidence of the nature of nonconformities, actions taken, and results of corrective actions."
      },
      {
        id: "continual-improvement",
        title: "10.3 CONTINUAL IMPROVEMENT",
        content: "Vezloo continually improves the suitability, adequacy, and effectiveness of the QMS by considering the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement.\n\nTools and methods for continual improvement include:\n- Management review findings\n- Internal audit results\n- Corrective action effectiveness review\n- Risk-based thinking and opportunity analysis\n- Customer feedback analysis\n- Process performance trend analysis"
      }
    ]
  },
  {
    id: "annex-1",
    title: "ANNEX 1 – QUALITY POLICY",
    content: "Vezloo is committed to delivering high-quality Business Process Outsourcing (BPO) services that meet and exceed customer expectations. Every employee of Vezloo shall be committed to ensuring the quality of all services delivered to customers.\n\nWe strive to act with due attention to quality and comply with all applicable legal and regulatory requirements.\n\nThis is achieved by:\n- Strict implementation of ISO 9001:2015 requirements and organizational standards\n- Hiring and developing competent personnel through continuous training and development\n- Monitoring practice compliance through internal audits and performance reviews\n- Enhancing customer satisfaction through reliable, accurate, and timely service delivery\n- Applying risk-based thinking to prevent nonconformities and improve outcomes\n- Pursuing continual improvement in all aspects of our operations and QMS\n\nThis Quality Policy is communicated to all employees and made available to relevant interested parties. It is reviewed periodically for continuing suitability."
  },
  {
    id: "annex-2",
    title: "ANNEX 2 – PROCESS INTERACTION MAP",
    content: "The Process Interaction Map illustrates how core, support, and management processes within Vezloo interact to deliver services that meet customer requirements.\n\nManagement Processes:\n- Strategic Planning & Management Review\n- Risk & Opportunity Management\n- Internal Audit\n\nCore Processes:\n- Customer Requirements & Contract Review\n- Service Planning & Delivery\n- Monitoring & Quality Control\n- Service Release & Delivery\n\nSupport Processes:\n- Human Resources & Training\n- Infrastructure & IT Management\n- Document & Record Control\n- Procurement & Supplier Management\n\nThe interaction between these processes is documented and maintained to ensure effective operation of the QMS."
  },
  {
    id: "annex-3",
    title: "ANNEX 3 – LIST OF PROCEDURES",
    content: "1. Procedure for Context of Organization (P/01)\n2. Procedure for Objectives and Targets (P/02)\n3. Procedure for Monitoring and Measurement (P/03)\n4. Procedure for Management Review (P/04)\n5. Procedure for Internal Audit (P/05)\n6. Procedure for Training, Awareness & Competence (P/06)\n7. Procedure for Control of Document and Record (P/07)\n8. Procedure for Correction and Corrective Action (P/08)\n9. Procedure for Control of Monitoring and Measuring Equipment (P/09)\n10. Procedure for Purchasing and Subcontracting (P/10)\n11. Procedure for Change Management (P/11)\n12. Procedure for Legal Compliance (P/12)\n13. Procedure for Control of Non-Conforming Outputs (P/13)"
  }
];
