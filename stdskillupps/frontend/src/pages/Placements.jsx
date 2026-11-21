import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';

const COMPANIES = [
  {
    company: "Google India",
    short: "Google",
    level: "Dream",
    package: "Approx. ₹18-30 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (400+ LeetCode), System design basics, C++ or Java, OS, DBMS, CN fundamentals, Python or Go, Behavioural prep (Googleyness). Beyond code: 1-2 internships (Google STEP or similar), Open-source contributions, Competitive programming rating (CodeChef/Codeforces), Hackathon wins, Strong GitHub projects. Needs 400+ LeetCode problems, strong CS fundamentals and an internship; campus seats are few and mostly go to top colleges, so off-campus and referrals matter a lot. Process: Online assessment (2 DSA rounds), then 3-4 technical interviews covering DSA, system design and Googliness, followed by a hiring committee review.",
    source: "https://www.google.com/about/careers/applications/early-career",
  },
  {
    company: "Microsoft India",
    short: "Microsoft",
    level: "Dream",
    package: "Approx. ₹20-25 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (300+ LeetCode), C# or C++ or Java, OS, DBMS, CN fundamentals, System design basics, Azure/cloud basics, OOP design. Beyond code: Microsoft Engage program, Internships, Open-source contributions, Hackathon wins, CodeChef/Codeforces rating. Needs strong DSA and CS fundamentals; hires from many colleges through Engage and campus drives, but seats are limited. Process: Online assessment (DSA), then 3-4 interview rounds on DSA, design and behaviour, ending with an HR round.",
    source: "https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing",
  },
  {
    company: "Amazon India",
    short: "Amazon",
    level: "Dream",
    package: "Approx. ₹18-24 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (300+ LeetCode), Java or C++, OS, DBMS, CN fundamentals, System design basics, Amazon Leadership Principles, AWS basics. Beyond code: Internships, LeetCode contest rating, Open-source contributions, Hackathon wins, Strong GitHub projects. The most reachable of the big three for an average-college student — strong DSA plus Leadership Principles can win it off-campus too. Process: Online assessment (2 DSA + debugging), then 3-4 interviews on DSA, Leadership Principles and system design, including a bar-raiser round.",
    source: "https://amazon.jobs/content/en/career-programs/university/sde",
  },
  {
    company: "Adobe",
    short: "Adobe",
    level: "Dream",
    package: "Approx. ₹25-40 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (400+ LeetCode), C++ (deep), OS, DBMS, CN fundamentals, OOP design, System design basics, JavaScript + React for web roles. Beyond code: Adobe internship, Competitive programming rating, Open-source contributions, Hackathon wins, Research projects. Needs elite DSA and strong CS fundamentals; very few campus seats outside top colleges, and the internship route is the main door in. Process: Online assessment (DSA + aptitude), then 3-4 technical interviews, ending with an HR round.",
    source: "https://www.adobe.com/careers.html",
  },
  {
    company: "Atlassian",
    short: "Atlassian",
    level: "Dream",
    package: "Approx. ₹25-35 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (400+ LeetCode), Java or Python, System design basics, OS, DBMS, CN fundamentals, API design, Behavioural prep (Atlassian values). Beyond code: Open-source contributions, Internships, Codeforces/CodeChef rating, Hackathon wins, Strong GitHub projects. Almost no campus hiring in India — mostly off-campus via HackerRank and referrals; needs elite DSA and values-fit. Process: HackerRank online assessment, a values interview, then 3-4 technical interviews on DSA and design.",
    source: "https://www.atlassian.com/company/careers",
  },
  {
    company: "Apple",
    short: "Apple",
    level: "Dream",
    package: "Approx. ₹20-35 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: C/C++ (deep), Data structures + algorithms, OS fundamentals, Embedded systems basics, Swift for app roles, System design basics. Beyond code: Embedded/hardware projects, Internships, Open-source contributions, Hackathon wins, Robotics/IoT projects. Very few fresher seats in India, mostly embedded and systems roles; needs deep C/C++ and hardware basics. Process: Online assessment (DSA + CS fundamentals), then 3-4 technical interviews on coding and systems, ending with an HR round.",
    source: "https://www.apple.com/careers/in/",
  },
  {
    company: "Oracle",
    short: "Oracle",
    level: "Top",
    package: "Approx. ₹12-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), Java (core + advanced), SQL + DBMS internals, OS/CN fundamentals, OOP design, Cloud basics. Beyond code: Internships, Database projects, Open-source contributions, Hackathon participation, SQL certification. Reachable with solid DSA and strong DBMS skills; hires from many campuses for Member of Technical Staff roles. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, DBMS and OS, ending with an HR round.",
    source: "https://www.oracle.com/careers/",
  },
  {
    company: "NVIDIA",
    short: "NVIDIA",
    level: "Dream",
    package: "Approx. ₹18-30 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: C++ (deep), DSA advanced (300+ LeetCode), OS + computer architecture, CUDA/GPU basics, Python + ML basics, System design basics. Beyond code: GPU/CUDA projects, AI/ML projects, Internships, Open-source contributions, Hackathon wins. Needs strong DSA plus C++/systems or AI skills; campus seats are few, and the internship is the main route in. Process: Online assessment (DSA + CS fundamentals), then 3-4 technical interviews on coding and systems or ML, ending with an HR round.",
    source: "https://www.nvidia.com/en-in/about-nvidia/careers/",
  },
  {
    company: "Rubrik",
    short: "Rubrik",
    level: "Dream",
    package: "Approx. ₹25-40 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (400+ LeetCode), C++ or Go, OS + distributed systems, DBMS fundamentals, System design basics, Python. Beyond code: Internships (Rubrik preferred), Competitive programming rating, Open-source contributions, Systems projects, Hackathon wins. Tiny fresher intake, almost all through internships; needs elite DSA and systems depth. Process: Online assessment (hard DSA), then 3-4 technical interviews on DSA and systems design, ending with an HR round.",
    source: "https://www.rubrik.com/company/careers",
  },
  {
    company: "Jane Street",
    short: "Jane Street",
    level: "Dream",
    package: "Approx. ₹40-80 LPA LPA CTC",
    roles: "Quantitative Trader / Researcher",
    path: "Skills: OCaml/functional programming, Probability + statistics, Maths puzzles, DSA advanced, Python, Trading/finance basics. Beyond code: Maths olympiad or competitive programming wins, Quantitative trading projects, Internships at quant firms, Research papers, Puzzle-solving profile. Near-impossible from an average college — hires almost only from IITs and top institutes, and needs elite maths plus functional programming. Process: Online assessment (maths + probability puzzles), then 4-5 phone and onsite interviews on probability, games and coding, ending with an HR round.",
    source: "https://www.janestreet.com/join-jane-street/",
  },
  {
    company: "Goldman Sachs",
    short: "Goldman Sachs",
    level: "Dream",
    package: "Approx. ₹22-30 LPA LPA CTC",
    roles: "Software Engineer / Analyst",
    path: "Skills: DSA advanced (300+ LeetCode), Java (core), OOP design, DBMS + SQL, OS/CN fundamentals, Finance basics. Beyond code: Internships, Hackathon wins (GS Summer Analyst), Open-source contributions, Competitive programming rating, Finance projects. Hires from many colleges through its open Engineering Campus Hiring program; needs strong DSA, Java and aptitude. Process: Online assessment (aptitude + 2 coding), then a Superday of 3-4 interviews on DSA, design and behaviour, ending with an HR round.",
    source: "https://www.goldmansachs.com/careers",
  },
  {
    company: "JP Morgan Chase",
    short: "JP Morgan Chase",
    level: "Top",
    package: "Approx. ₹15-25 LPA LPA CTC",
    roles: "Software Engineer / Analyst",
    path: "Skills: DSA intermediate-advanced (250+ LeetCode), Java, SQL + DBMS, OS/CN fundamentals, Spring Boot basics, Finance basics. Beyond code: Code for Good participation, Internships, Hackathon wins, Open-source contributions, Banking/fintech projects. Reachable with good DSA and Java; the Code for Good hackathon and campus drives are the main doors in. Process: Online assessment (aptitude + coding), then 2-3 technical interviews, ending with an HR round.",
    source: "https://www.jpmorganchase.com/careers",
  },
  {
    company: "Morgan Stanley",
    short: "Morgan Stanley",
    level: "Top",
    package: "Approx. ₹15-25 LPA LPA CTC",
    roles: "Software Engineer / Analyst",
    path: "Skills: DSA advanced (300+ LeetCode), Java, SQL + DBMS, OS/CN fundamentals, OOP design, Finance basics. Beyond code: Technology Summer Analyst internship, Hackathon wins, Open-source contributions, Competitive programming rating, Finance projects. Selective but hires from many campuses; needs strong DSA, Java and CS fundamentals. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.morganstanley.com/careers",
  },
  {
    company: "Cisco",
    short: "Cisco",
    level: "Top",
    package: "Approx. ₹15-20 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), C/C++ or Python, Computer networks (deep), OS fundamentals, System design basics, Java. Beyond code: Internships, Networking/CCNA basics, Open-source contributions, Hackathon participation, Networking projects. Reachable with solid DSA and networking basics; hires from many campuses. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, networks and OS, ending with an HR round.",
    source: "https://www.cisco.com/c/en/us/about/careers.html",
  },
  {
    company: "Intel",
    short: "Intel",
    level: "Top",
    package: "Approx. ₹12-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), C/C++, OS + computer architecture, Embedded systems basics, Python, System design basics. Beyond code: Internships, Hardware/embedded projects, Open-source contributions, Hackathon participation, VLSI/digital design basics. Reachable with good DSA and hardware/systems basics; campus plus off-campus, and ECE students have an edge. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, OS and hardware, ending with an HR round.",
    source: "https://www.intel.com/content/www/us/en/jobs/jobs-at-intel.html",
  },
  {
    company: "Qualcomm",
    short: "Qualcomm",
    level: "Top",
    package: "Approx. ₹15-20 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), C/C++, OS + computer architecture, Embedded systems, Python, Wireless/communication basics. Beyond code: Internships, Embedded projects, Open-source contributions, Hackathon participation, Digital design projects. Reachable with DSA and C/systems skills; mostly off-campus drives, and ECE students have an edge. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, OS and embedded topics, ending with an HR round.",
    source: "https://www.qualcomm.com/company/careers",
  },
  {
    company: "Samsung",
    short: "Samsung",
    level: "Top",
    package: "Approx. ₹12-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), C/C++, Java + Android, OS fundamentals, DBMS basics, System design basics. Beyond code: Internships, Android/app projects, Open-source contributions, Hackathon participation, Strong GitHub projects. Hires from many campuses (R&D); needs solid DSA and C++/Android skills. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, OS and C++, ending with an HR round.",
    source: "https://www.samsung.com/in/about-us/careers/",
  },
  {
    company: "Flipkart",
    short: "Flipkart",
    level: "Top",
    package: "Approx. ₹18-22 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (300+ LeetCode), Java, System design basics, DBMS + SQL, OS/CN fundamentals, Spring Boot/microservices. Beyond code: Internships, Hackathon wins, Open-source contributions, Competitive programming rating, E-commerce scale projects. Reachable with strong DSA and system design; hires from many colleges, off-campus too. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design (HLD/LLD), ending with an HR round.",
    source: "https://www.flipkartcareers.com/",
  },
  {
    company: "Razorpay",
    short: "Razorpay",
    level: "Top",
    package: "Approx. ₹15-20 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java/Go/Python, System design basics, DBMS + SQL, Microservices, Payment/fintech basics. Beyond code: Internships, Backend projects, Open-source contributions, Hackathon wins, Fintech projects. Reachable with strong DSA and backend skills; hires from many colleges off-campus. Process: Online assessment (DSA), then 2-3 technical interviews on DSA, design and backend, ending with an HR round.",
    source: "https://razorpay.com/jobs/",
  },
  {
    company: "PhonePe",
    short: "PhonePe",
    level: "Top",
    package: "Approx. ₹15-20 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java, System design basics, DBMS + SQL, Microservices, UPI/payments basics. Beyond code: Internships, Backend projects, Open-source contributions, Hackathon wins, Fintech projects. Reachable with strong DSA and backend skills; hires from many colleges. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.phonepe.com/careers/",
  },
  {
    company: "Postman",
    short: "Postman",
    level: "Top",
    package: "Approx. ₹15-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), JavaScript/TypeScript, Node.js, REST API design, DBMS basics, System design basics. Beyond code: Internships, API projects, Open-source contributions, Hackathon wins, Strong GitHub projects. Reachable with strong DSA and API/backend skills; hires via campus and off-campus. Process: Online assessment (DSA), then 2-3 technical interviews on DSA, design and JavaScript, ending with an HR round.",
    source: "https://www.postman.com/company/careers/",
  },
  {
    company: "Zoho",
    short: "Zoho",
    level: "Core",
    package: "Approx. ₹6-10 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (150+ problems), C/Java, OOP design, DBMS + SQL, OS fundamentals, Problem-solving speed. Beyond code: Coding contest participation, Personal projects, Internships, Hackathon participation, Strong GitHub profile. Very reachable — no strict marks filter, hires on pure coding ability from any college. Process: 5-round test (aptitude, C/Java coding, advanced coding, system design, HR) — all on-site style.",
    source: "https://www.zoho.com/careers/",
  },
  {
    company: "Freshworks",
    short: "Freshworks",
    level: "Core",
    package: "Approx. ₹10-14 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), JavaScript + React, Node.js, DBMS + SQL, REST APIs, OS/CN fundamentals. Beyond code: Internships, Full-stack projects, Open-source contributions, Hackathon participation, Strong GitHub projects. Reachable with solid DSA and full-stack skills; hires from many colleges. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, JavaScript and design, ending with an HR round.",
    source: "https://www.freshworks.com/company/careers/",
  },
  {
    company: "Swiggy",
    short: "Swiggy",
    level: "Top",
    package: "Approx. ₹14-20 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java/Go, System design basics, DBMS + SQL, Microservices, Real-time systems basics. Beyond code: Internships, Backend projects, Open-source contributions, Hackathon wins, Scale projects. Reachable with strong DSA and backend/scale skills; hires from many colleges. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.swiggy.com/careers",
  },
  {
    company: "Zomato",
    short: "Zomato",
    level: "Top",
    package: "Approx. ₹16-22 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java/Go/Python, System design basics, DBMS + SQL, Microservices, OS/CN fundamentals. Beyond code: Internships, Backend projects, Open-source contributions, Hackathon wins, Strong GitHub projects. Reachable with strong DSA and backend skills; hires from many colleges. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.zomato.com/careers",
  },
  {
    company: "Meesho",
    short: "Meesho",
    level: "Top",
    package: "Approx. ₹12-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate-advanced (200+ LeetCode), Python, System design basics, DBMS + SQL, Microservices, Java. Beyond code: Internships, Backend projects, Open-source contributions, Hackathon participation, E-commerce projects. Reachable with solid DSA and Python/backend skills; hires from many colleges. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.meesho.io/jobs",
  },
  {
    company: "CRED",
    short: "CRED",
    level: "Top",
    package: "Approx. ₹16-24 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (350+ LeetCode), Java/Kotlin, System design basics, DBMS + SQL, Microservices, Fintech basics. Beyond code: Internships at top startups, Hackathon wins, Open-source contributions, Competitive programming rating, Standout GitHub projects. Very selective for freshers — needs elite DSA and backend-at-scale skills plus a standout profile. Process: Online assessment (hard DSA), then 3 technical interviews on DSA, design and backend, ending with an HR round.",
    source: "https://careers.cred.club/",
  },
  {
    company: "Groww",
    short: "Groww",
    level: "Top",
    package: "Approx. ₹12-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate-advanced (200+ LeetCode), Java/Python, DBMS + SQL, System design basics, REST APIs, Data basics. Beyond code: Internships, Backend/data projects, Open-source contributions, Hackathon participation, Fintech projects. Reachable with solid DSA and backend/data skills; hires from many colleges. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://groww.in/careers",
  },
  {
    company: "Zerodha",
    short: "Zerodha",
    level: "Top",
    package: "Approx. ₹12-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: Python/Go, DSA intermediate-advanced (200+ LeetCode), Linux + OS fundamentals, DBMS + SQL, System design basics, Finance basics. Beyond code: Open-source contributions, Personal projects, Hackathon wins, Trading/fintech projects, Strong GitHub profile. Very selective with a small intake — needs strong Python/Go and systems skills plus a standout profile. Process: Online assessment (coding + aptitude), then 2-3 technical interviews on coding and systems, ending with an HR round.",
    source: "https://zerodha.com/careers/",
  },
  {
    company: "Zepto",
    short: "Zepto",
    level: "Top",
    package: "Approx. ₹15-22 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java/Go, System design basics, DBMS + SQL, Microservices, Kafka/queues basics. Beyond code: Internships, Backend projects, Open-source contributions, Hackathon wins, Strong GitHub projects. Reachable with strong DSA and microservices skills; hires aggressively from many colleges. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.zeptonow.com/careers",
  },
  {
    company: "Uber",
    short: "Uber",
    level: "Dream",
    package: "Approx. ₹22-30 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (400+ LeetCode), Java/Go/C++, System design (HLD + LLD), DBMS + SQL, OS/CN fundamentals, Distributed systems basics. Beyond code: Internships, Competitive programming rating, Open-source contributions, Hackathon wins, Distributed systems projects. Needs elite DSA and system design; campus seats are few and mostly at top colleges, and off-campus is hard. Process: Online assessment (2 hard DSA), then 3-4 technical interviews on DSA, design and behaviour, ending with an HR round.",
    source: "https://www.uber.com/in/en/careers/",
  },
  {
    company: "Salesforce",
    short: "Salesforce",
    level: "Dream",
    package: "Approx. ₹18-28 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (300+ LeetCode), Java, OOP design, DBMS + SQL, System design basics, Cloud/SaaS basics. Beyond code: Salesforce internship (Futureforce), Trailhead badges, Internships, Open-source contributions, Hackathon wins. Needs strong DSA and Java; hires freshers through Futureforce, with limited seats but open to many colleges. Process: Online assessment (DSA + aptitude), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.salesforce.com/careers/",
  },
  {
    company: "SAP Labs",
    short: "SAP Labs",
    level: "Top",
    package: "Approx. ₹11-18 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), Java, SQL + DBMS, OOP design, OS/CN fundamentals, Cloud basics. Beyond code: Internships, Database projects, Open-source contributions, Hackathon participation, SAP certification basics. Reachable with solid DSA and Java/ABAP basics; hires from many campuses. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, DBMS and Java, ending with an HR round.",
    source: "https://jobs.sap.com/",
  },
  {
    company: "ServiceNow",
    short: "ServiceNow",
    level: "Top",
    package: "Approx. ₹15-22 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java, JavaScript, DBMS + SQL, System design basics, Cloud basics. Beyond code: Internships, Full-stack projects, Open-source contributions, Hackathon wins, ServiceNow certification basics. Reachable with strong DSA and Java/JavaScript; hires from many campuses. Process: Online assessment (DSA + aptitude), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://www.servicenow.com/careers.html",
  },
  {
    company: "Walmart Global Tech",
    short: "Walmart Global Tech",
    level: "Top",
    package: "Approx. ₹16-25 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA advanced (250+ LeetCode), Java, System design basics, DBMS + SQL, Spring Boot/microservices, Cloud basics. Beyond code: Internships, Hackathon wins (CodeHers for women), Open-source contributions, Competitive programming rating, Retail-tech projects. Reachable with strong DSA and Java; hires from many colleges and is a good middle path to product-level pay. Process: Online assessment (DSA), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://careers.walmart.com/",
  },
  {
    company: "Target India",
    short: "Target India",
    level: "Top",
    package: "Approx. ₹14-20 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate-advanced (200+ LeetCode), Java/Python, SQL + data engineering, System design basics, React/Node.js, Cloud basics. Beyond code: Internships, Full-stack/data projects, Open-source contributions, Hackathon participation, Strong GitHub projects. Reachable with solid DSA and full-stack/data skills; hires from many colleges. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://corporate.target.com/careers",
  },
  {
    company: "Wells Fargo",
    short: "Wells Fargo",
    level: "Top",
    package: "Approx. ₹10-16 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), Java, SQL + DBMS, Spring Boot, OS/CN fundamentals, Finance basics. Beyond code: Internships, Banking/fintech projects, Open-source contributions, Hackathon participation, Java certification basics. Reachable with solid DSA and Java; hires from many campuses into stable banking tech. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA, Java and DBMS, ending with an HR round.",
    source: "https://www.wellsfargo.com/about/careers/",
  },
  {
    company: "Lowe's India",
    short: "Lowe's India",
    level: "Top",
    package: "Approx. ₹12-16 LPA LPA CTC",
    roles: "Software Development Engineer (SDE)",
    path: "Skills: DSA intermediate (200+ LeetCode), Java, SQL + DBMS, System design basics, DevOps basics, Cloud basics. Beyond code: Internships, Full-stack projects, Open-source contributions, Hackathon participation, DevOps/cloud projects. Reachable with solid DSA and Java/DevOps skills; hires from many colleges. Process: Online assessment (aptitude + coding), then 2-3 technical interviews on DSA and design, ending with an HR round.",
    source: "https://corporate.lowes.com/careers",
  },
  {
    company: "Deloitte",
    short: "Deloitte",
    level: "Core",
    package: "Approx. ₹6-12 LPA LPA CTC",
    roles: "Analyst / Consultant",
    path: "Skills: Aptitude + logical reasoning, SQL + Excel, Python/Java basics, Communication + presentation, DBMS basics, Business analysis basics. Beyond code: Case competitions, Internships, Leadership roles (clubs/fests), Volunteering, Strong communication profile. Very reachable — hires in bulk from many colleges for tech and consulting roles; needs aptitude and communication more than elite DSA. Process: Online assessment (aptitude + English + coding for tech roles), group discussion or case study, then 2 interviews (technical + HR).",
    source: "https://www2.deloitte.com/in/en/careers.html",
  },
  {
    company: "EY",
    short: "EY",
    level: "Core",
    package: "Approx. ₹6-11 LPA LPA CTC",
    roles: "Analyst / Consultant",
    path: "Skills: Aptitude + logical reasoning, SQL, Python/Java basics, Excel + data basics, Communication, Cybersecurity basics (for cyber roles). Beyond code: Case competitions, Internships, Leadership roles, Volunteering, Analytics projects. Very reachable — hires in bulk for tech consulting and cyber roles; needs aptitude, SQL and communication. Process: Online assessment (aptitude + English), group discussion, then 2 interviews (technical + HR).",
    source: "https://www.ey.com/en_in/careers",
  },
  {
    company: "PwC",
    short: "PwC",
    level: "Core",
    package: "Approx. ₹6-11 LPA LPA CTC",
    roles: "Analyst / Consultant",
    path: "Skills: Aptitude + logical reasoning, SQL + Excel, Python/Java basics, Data analysis basics, Communication, Business analysis basics. Beyond code: Case competitions, Internships, Leadership roles, Volunteering, Analytics projects. Very reachable — hires in bulk for tech analyst and consulting roles. Process: Online assessment (aptitude + English), group discussion, then 2 interviews (technical + HR).",
    source: "https://www.pwc.com/in/careers.html",
  },
  {
    company: "KPMG",
    short: "KPMG",
    level: "Core",
    package: "Approx. ₹6-10 LPA LPA CTC",
    roles: "Analyst / Consultant",
    path: "Skills: Aptitude + logical reasoning, SQL + Excel, Python/Java basics, Risk/consulting basics, Communication, Data analysis basics. Beyond code: Case competitions, Internships, Leadership roles, Volunteering, Analytics projects. Very reachable — hires in bulk for consulting and risk roles. Process: Online assessment (aptitude + English), group discussion, then 2 interviews (technical + HR).",
    source: "https://kpmg.com/in/en/home/careers.html",
  },
  {
    company: "McKinsey",
    short: "McKinsey",
    level: "Dream",
    package: "Approx. ₹15-22 LPA LPA CTC",
    roles: "Business Analyst",
    path: "Skills: Case interview mastery, Mental maths + estimation, SQL + Excel, Python basics, Structured problem-solving, Communication + presentation. Beyond code: Case competition wins, Leadership roles, Consulting club, Internships, Top academic record. Near-impossible for a CSE undergrad from an average college — hires Business Analysts almost only from IITs and IIMs, and needs elite aptitude plus case skills. Process: Online assessment (problem-solving game + aptitude), then 2-3 case interviews (personal experience + case), ending with a final round.",
    source: "https://www.mckinsey.com/careers",
  },
  {
    company: "Tata Consultancy Services (TCS)",
    short: "TCS",
    level: "Mass",
    package: "Approx. ₹3-7 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, C/Java/Python basics, DBMS + SQL basics, OOP basics, OS/CN basics, Communication. Beyond code: NQT practice, Basic projects, Internships (optional), Coding practice, Communication skills. Almost certain with basic aptitude and coding — the safety net; Ninja is easy, Digital needs good coding. Process: NQT (aptitude + coding), then a technical interview and an HR round.",
    source: "https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring",
  },
  {
    company: "Infosys",
    short: "Infosys",
    level: "Mass",
    package: "Approx. ₹3-10 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, Python/Java basics, DBMS + SQL basics, OOP basics, OS/CN basics, Communication. Beyond code: InfyTQ practice, Basic projects, Internships (optional), Coding practice, Communication skills. Almost certain with basic aptitude and coding; the SP track needs strong coding. Process: InfyTQ or NQT-style test (aptitude + coding), then a technical interview and an HR round.",
    source: "https://www.infosys.com/careers/graduates.html",
  },
  {
    company: "Wipro",
    short: "Wipro",
    level: "Mass",
    package: "Approx. ₹3.5-6.5 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, C/Java/Python basics, DBMS + SQL basics, OOP basics, Communication, OS basics. Beyond code: Elite NTH practice, Basic projects, Internships (optional), Coding practice, Communication skills. Almost certain with basic aptitude and coding; Turbo needs better coding. Process: Elite NTH (aptitude + coding + English), then a technical interview and an HR round.",
    source: "https://careers.wipro.com/content/Early-Careers/",
  },
  {
    company: "HCLTech",
    short: "HCLTech",
    level: "Mass",
    package: "Approx. ₹3.5-5 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, C/Java/Python basics, DBMS basics, OOP basics, Communication, OS basics. Beyond code: Basic projects, Coding practice, Internships (optional), Communication skills, Aptitude practice. Almost certain with basic aptitude and coding. Process: Online assessment (aptitude + coding), then a technical interview and an HR round.",
    source: "https://www.hcltech.com/careers",
  },
  {
    company: "Cognizant India",
    short: "Cognizant",
    level: "Mass",
    package: "Approx. ₹4-6.75 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, C/Java/Python basics, DBMS + SQL basics, OOP basics, Communication, OS basics. Beyond code: Basic projects, Coding practice, Internships (optional), Communication skills, Aptitude practice. Almost certain with basic aptitude and coding; GenC Next needs stronger coding. Process: Online assessment (aptitude + coding), then technical and HR interviews.",
    source: "https://careers.cognizant.com/india-en/pathways-to-cognizant/genc-program/",
  },
  {
    company: "Accenture India",
    short: "Accenture",
    level: "Mass",
    package: "Approx. ₹4-6.5 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, C/Java/Python basics, DBMS + SQL basics, Communication (strong filter), OOP basics, Cloud basics. Beyond code: Basic projects, Coding practice, Internships (optional), Communication skills, Aptitude practice. Almost certain with aptitude, coding and communication; the highest-paying of the mass recruiters. Process: Cognitive and technical assessment, coding test, communication assessment, then an HR round.",
    source: "https://www.accenture.com/in-en/careers",
  },
  {
    company: "Capgemini",
    short: "Capgemini",
    level: "Mass",
    package: "Approx. ₹4-5 LPA LPA CTC",
    roles: "Software Engineer (bulk hiring tracks)",
    path: "Skills: Aptitude + reasoning, C/Java/Python basics, DBMS basics, Communication (strong filter), OOP basics, Pseudo-code practice. Beyond code: Basic projects, Coding practice, Internships (optional), Communication skills, Aptitude practice. Almost certain with aptitude and communication; communication is a strong filter here. Process: Online assessment (pseudo-code + aptitude + gamified test), behavioural profiling, then technical and HR interviews.",
    source: "https://www.capgemini.com/in-en/careers/",
  },
];

const LEVEL_STYLES = {
  Dream: 'border-fuchsia-200/30 bg-fuchsia-200/10 text-fuchsia-100',
  Top: 'border-sky-200/30 bg-sky-200/10 text-sky-100',
  Core: 'border-emerald-200/30 bg-emerald-200/10 text-emerald-100',
  Mass: 'border-zinc-200/30 bg-zinc-200/10 text-zinc-100',
};

export default function Placements() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMPANIES.filter((item) => {
      const matchesQuery = !q || `${item.company} ${item.roles} ${item.path}`.toLowerCase().includes(q);
      return matchesQuery && (level === 'All' || item.level === level);
    });
  }, [query, level]);

  return (
    <PageWrapper>
      <main className="w-full px-4 pb-16 pt-28">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold text-white">
          Placement <span className="text-gradient">targets</span>
        </motion.h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
          A practical starting map for a 4th-year BTech CSE student: who hires, what roles to watch, the approximate package signal, and the preparation level needed.
        </p>
        <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-100/[0.08] p-4 text-xs leading-relaxed text-amber-50/90">
          Package figures are approximate annual India CTC/total-compensation benchmarks from public company and salary sources, not guaranteed offers or take-home pay. They vary by year, role, location, hiring track, stock/bonus and written offer. Always verify the current official job notice.
        </div>

        <div className="glass mt-6 p-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, role, skill or preparation…"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-white"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {['All', 'Dream', 'Top', 'Core', 'Mass'].map((item) => (
              <button
                key={item}
                type="button"
                data-no-liquid
                onClick={() => setLevel(item)}
                className={`liquid-button rounded-full border px-4 py-1.5 text-xs font-semibold ${level === item ? 'border-transparent bg-white text-black shadow-glow' : 'border-white/20 bg-white/10 text-zinc-300'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filtered.map((item, index) => (
            <motion.div key={item.company} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.35) }}>
              <GlassCard className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{item.company}</h2>
                    <p className="mt-1 text-sm text-zinc-300">{item.roles}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${LEVEL_STYLES[item.level]}`}>
                    {item.level}
                  </span>
                </div>
                <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">{item.package}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">How to reach this placement</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">{item.path}</p>
                </div>
                <a href={item.source} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-sky-100 underline underline-offset-2">
                  Check source / current opening ↗
                </a>
              </GlassCard>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <GlassCard className="mt-6 text-center text-sm text-zinc-300">No company matches this search.</GlassCard>}
      </main>
    </PageWrapper>
  );
}
