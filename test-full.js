const fs = require('fs');

const rawData = `Chandra Sekhar Reddy Ambati
9133746208 | chandhureddy9133@gmail.com | linkedin.com/in/chandra14 | github.com/chandra9133 |
portfolio-gamma-liart-90.vercel.app
PROFESSIONAL SUMMARY
Frontend Developer with hands-on internship experience building responsive pages for a live SaaS platform. Skilled in HTML5,
CSS3, JavaScript, and React.js, with experience in frontend interactions, form validation, cross-device responsiveness, and UI
bug fixes. Familiar with SQL, Java, and Git/GitHub. Seeking an entry-level Frontend Developer or Web Developer role.
Technical Skills
Frontend: HTML5, CSS3, JavaScript, React.js
Programming Languages: Java
Databases: SQL
Version Control: Git, GitHub,
Tools: VS Code
Experience
Projkeez Group Pvt Ltd –MyClickBook Web Development Intern Bengaluru, Karnataka, India (Remote)
Mar 2026 – Jun 2026
• Developed and customized web pages for a live SaaS scheduling platform using HTML, CSS, and JavaScript, converting
design requirements into functional, pixel-accurate frontend code.
• Collaborated with developers, designers, HR, and leadership while working on website requirements and changes.
• Implemented JavaScript logic for dynamic content rendering and user interaction handling, improving frontend reliability
across multiple pages.
Projects
Local Business Discovery Platform | React.js, Context API, JavaScript, CSS3 | GitHub 2026
• Built a React.js local business directory app using the Context API for global state management and localStorage for
persistence, supporting full CRUD on business listings and reviews.
• Implemented URL-query-based search and category filtering, plus business detail pages displaying ratings, pricing, and
user reviews.
E-Mart – Multi-Category E-Commerce Platform | React.js, React Router, Context API, CSS3 | GitHub 2025
• Built a multi-category e-commerce storefront in React with 130+ products across 11 categories (electronics, fashion,
furniture, appliances), using React Router for dynamic listing and product-detail routes.
• Implemented global cart state with the Context API, enabling add/remove-from-cart functionality across all product
pages without prop drilling.
Education
Geethanjali College of Engineering and Technology B.Tech in Electronics and Communication Engineering – CGPA: 8.1/10 Government Polytechnic College Diploma in Electronics and Communication Engineering – 90% Srivani High School Secondary School Education – 96% CERTIFICATIONS
Telangana, India
Sep 2023 – Aug 2026
Andhra Pradesh, India
Jun 2020 – Apr 2023
Andhra Pradesh, India
Mar 2019 – Mar 2020
• Responsive Web Design , Web Dev with ChatGPT , Python for Beginners
ACHIEVEMENT
• Built and presented a working prototype at a national-level hackathon, demonstrating the ability to develop and present a
complete product under time constraints.`;

const lowerText = rawData.toLowerCase();

let degreeObjective = "Post Graduate / Masters";

    const domains = {
      arts_humanities_social_sciences: { score: 0, keywords: ["bachelor of arts", "ba", "b.a", "bachelor of social work", "bsw", "bachelor of fine arts", "bfa", "bachelor of design", "b.des", "master of arts", "ma", "m.a", "master of social work", "msw", "master of fine arts", "mfa", "master of design", "m.des", "master of library and information science", "mlis", "master of public administration", "mpa", "master of international relations", "mir", "master of development studies", "arts", "humanities", "social sciences", "history", "philosophy", "sociology", "political science", "literature", "languages", "anthropology", "geography", "psychology", "economics", "english", "library science", "linguistics", "cultural studies", "applied arts", "painting", "sculpture", "visual communication", "textile design", "ceramic design", "interior design", "fashion design", "game design", "industrial design", "clinical social work", "community development", "child welfare"] },
      commerce_management: { score: 0, keywords: ["bachelor of commerce", "b.com", "bcom", "bachelor of business administration", "bba", "bachelor of management studies", "bms", "master of commerce", "m.com", "mcom", "master of business administration", "mba", "master of management studies", "mms", "executive mba", "emba", "commerce", "management", "business", "finance", "marketing", "accounting", "hr", "sales", "entrepreneurship", "human resource management", "international business", "banking", "insurance", "supply chain management", "logistics", "operations management", "taxation", "business analytics", "retail management", "e-commerce", "event management", "healthcare management"] },
      science_technology: { score: 0, keywords: ["bachelor of science", "b.sc", "bsc", "b.s.", "bs", "bachelor of computer applications", "bachelor of computer application", "computer application", "computer applications", "bca", "bachelor of technology", "b.tech", "btech", "bachelor of engineering", "b.e", "be", "master of data science", "mds", "master of artificial intelligence", "mai", "master of environmental management", "mem", "master of science", "m.sc", "msc", "m.s.", "ms", "master of technology", "m.tech", "mtech", "master of engineering", "m.e", "me", "master of computer applications", "master of computer application", "mca", "science", "technology", "computer science", "it", "engineering", "software", "physics", "chemistry", "mathematics", "biology", "data", "ai", "information technology", "information science", "information systems", "informatics", "artificial intelligence", "machine learning", "data science", "cybersecurity", "software engineering", "cloud computing", "mechanical engineering", "civil engineering", "electrical engineering", "electronics and communication", "chemical engineering", "aerospace engineering", "robotics", "mechatronics", "biotechnology", "microbiology", "genetics", "zoology", "botany", "environmental science", "statistics", "geology", "food technology", "bioinformatics"] },
    };

    Object.keys(domains).forEach(key => {
      const d = domains[key];
      d.keywords.forEach(kw => {
        const safeKw = kw.replace(/\./g, '\\.');
        const regex = new RegExp(`\\b${safeKw}\\b`, 'gi');
        const matches = rawData.match(regex);
        if (matches) {
          let weight = 1;
          if (kw.includes("bachelor") || kw.includes("master") || kw.includes("tech")) {
            weight = 5;
          }
          if (["arts", "science", "commerce", "management", "history", "english", "languages", "data", "it", "media", "ba", "ma", "bs", "ms", "bsc", "msc", "b.a", "m.a", "b.s.", "m.s.", "b.sc", "m.sc"].includes(kw)) {
            weight = 1; 
          }
          if (degreeObjective.toLowerCase().includes(kw)) {
            if (!["ba", "ma", "bs", "ms", "bsc", "msc", "b.a", "m.a", "b.s.", "m.s.", "b.sc", "m.sc", "bachelor", "master"].includes(kw)) {
               weight += 50; 
            }
          }
          d.score += (matches.length * weight);
        }
      });
    });
    console.log(domains);
