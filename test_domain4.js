const rawData = "btech ms in computer science usa";
const domains = {
      science_technology: { score: 0, keywords: ["bachelor of science", "b.sc", "bsc", "b.s.", "bs", "bachelor of computer applications", "bachelor of computer application", "computer application", "computer applications", "bca", "bachelor of technology", "b.tech", "btech", "bachelor of engineering", "b.e", "be", "master of data science", "mds", "master of artificial intelligence", "mai", "master of environmental management", "mem", "master of science", "m.sc", "msc", "m.s.", "ms", "master of technology", "m.tech", "mtech", "master of engineering", "m.e", "me", "master of computer applications", "master of computer application", "mca", "science", "technology", "computer science", "it", "engineering", "software", "physics", "chemistry", "mathematics", "biology", "data", "ai", "information technology", "artificial intelligence", "machine learning", "data science", "cybersecurity", "software engineering", "cloud computing", "mechanical engineering", "civil engineering", "electrical engineering", "electronics and communication", "chemical engineering", "aerospace engineering", "robotics", "mechatronics", "biotechnology", "microbiology", "genetics", "zoology", "botany", "environmental science", "statistics", "geology", "food technology", "bioinformatics"] },
      medicine_allied_health: { score: 0, keywords: ["bachelor of dental science", "bachelor of surgery", "mbbs", "bachelor of dental surgery", "bds", "bachelor of ayurvedic medicine and surgery", "bams", "bachelor of homeopathic medicine and surgery", "bhms", "bachelor of physiotherapy", "bpt", "bachelor of science in nursing", "b.sc nursing", "bachelor of pharmacy", "b.pharm", "doctor of medicine", "md", "master of surgery", "master of dental surgery", "mds", "master of pharmacy", "m.pharm", "master of physiotherapy", "mpt", "master of public health", "mph", "master of science in nursing", "m.sc nursing", "nursing", "medicine", "health", "pharmacy", "dentistry", "public health", "physiotherapy", "allied health", "general medicine", "general surgery", "pediatrics", "orthopedics", "obstetrics", "gynecology", "dermatology", "psychiatry", "anesthesia", "radiology", "cardiology", "neurology", "oncology", "gastroenterology", "nephrology", "urology", "ophthalmology", "ent", "clinical research", "pharmacology", "pharmaceutics", "pharmacognosy", "toxicology", "orthodontics", "periodontics", "prosthodontics", "oral surgery", "ayurveda", "homeopathy", "unani"] }
};
Object.keys(domains).forEach(key => {
  const d = domains[key];
  d.keywords.forEach(kw => {
    const safeKw = kw.replace(/\./g, '\\.');
    const regex = new RegExp(`\\b${safeKw}\\b`, 'gi');
    const matches = rawData.match(regex);
    if (matches) {
      let weight = 1;
      if (kw.includes("bachelor") || kw.includes("master") || kw.length <= 5 || kw.includes("tech")) {
        weight = 10;
      }
      if (["arts", "science", "commerce", "management", "history", "english", "languages", "data", "it", "media"].includes(kw)) {
        weight = 1; 
      }
      d.score += (matches.length * weight);
      console.log(`Matched ${kw} in ${key} with weight ${weight}`);
    }
  });
});
let primaryDomain = "science_technology";
let maxScore = 0;
Object.entries(domains).forEach(([domain, data]) => {
  if (data.score > maxScore) {
    maxScore = data.score;
    primaryDomain = domain;
  }
});
console.log(primaryDomain);
