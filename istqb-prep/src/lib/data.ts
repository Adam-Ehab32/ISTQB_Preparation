export type K='K1'|'K2'|'K3';
export const KL:Record<K,{label:string;sec:number}>={K1:{label:'Recall',sec:30},K2:{label:'Understanding',sec:60},K3:{label:'Application',sec:120}};
export const CH=['Fundamentals','Testing in the SDLC','Static Testing','Analysis & Design','Managing Tests','Test Tools'];
export const TOPICS=[
{id:'t1',ch:1,title:'Testing vs debugging',summary:'Testing finds failures; debugging locates and removes their causes. Confirmation testing checks the fix.'},
{id:'t2',ch:1,title:'Seven principles',summary:'Presence not absence of defects, no exhaustive testing, early testing, defect clustering, tests wear out, context, absence-of-defects fallacy.'},
{id:'t3',ch:1,title:'Test process',summary:'Planning, monitoring and control, analysis, design, implementation, execution, completion.'},
{id:'t4',ch:2,title:'Test levels',summary:'Component, component integration, system, system integration and acceptance testing.'},
{id:'t5',ch:2,title:'Test types',summary:'Functional, non-functional, black-box and white-box testing.'},
{id:'t6',analogy:"Fix the tap, then test every other tap for new leaks: the first is confirmation, the second is regression.",ch:2,title:'Change-related',summary:'Confirmation testing checks a fix; regression testing checks for side effects.'},
{id:'t7',ch:3,title:'Static vs dynamic',summary:'Static testing examines work products without running code and finds defects early.'},
{id:'t8',ch:3,title:'Review process',summary:'Planning, initiation, individual review, communication and analysis, fixing and reporting.'},
{id:'t9',ch:3,title:'Review types',summary:'Informal, walkthrough, technical review, inspection (most formal).'},
{id:'t10',analogy:"Testing a vending machine only through its buttons and coin slot, without opening the case.",ch:4,title:'Black-box',summary:'Equivalence partitioning, boundary value analysis, decision tables, state transitions.'},
{id:'t11',analogy:"A mechanic inspecting the engine itself instead of just driving the car.",ch:4,title:'White-box',summary:'Statement and branch coverage. 100% branch coverage implies 100% statement coverage.'},
{id:'t12',ch:4,title:'Experience-based',summary:'Error guessing, exploratory testing and checklist-based testing.'},
{id:'t13',analogy:"Estimating a commute with best, likely and worst cases instead of one hopeful number.",ch:5,title:'Planning & estimation',summary:'Entry and exit criteria; ratio, extrapolation, Wideband Delphi, three-point (a+4m+b)/6.'},
{id:'t14',analogy:"Packing by what hurts most to forget (passport) before what is merely nice (a book).",ch:5,title:'Risk-based testing',summary:'Risk level = likelihood x impact. Product and project risks drive priority.'},
{id:'t15',ch:5,title:'Defect management',summary:'Reports record expected vs actual results, severity, priority, status and environment.'},
{id:'t16',ch:6,title:'Tool categories',summary:'Management, static, design, execution and coverage, performance, DevOps tools.'},
{id:'t17',ch:6,title:'Automation benefits',summary:'Saves repetitive effort, adds consistency and objectivity, reduces human error.'},
{id:'t18',ch:6,title:'Automation risks',summary:'Unrealistic expectations, underestimated effort, testware maintenance, over-reliance.'}];
export const QS:{id:string;k:K;ch:number;stem:string;options:string[];correct:number;hint:string;explanation:string;analogy?:string;d?:number;set?:string}[]=[
{id:'q1',k:'K1',ch:1,stem:'Which of the following is one of the seven testing principles?',options:['Testing can prove the absence of defects','Testing shows the presence, not the absence, of defects','Early testing is rarely cost effective','Defects are evenly distributed'],correct:1,hint:'Think about what testing can never guarantee.',explanation:'Principle 1: testing reduces the probability of undiscovered defects but cannot prove correctness. Defects cluster, and early testing saves cost.'},
{id:'q2',k:'K1',ch:2,stem:'Which of the following is a test level?',options:['Component testing','Boundary value testing','Smoke testing','Exploratory testing'],correct:0,hint:'Levels are about scope in the lifecycle, not technique.',explanation:'Levels: component, component integration, system, system integration, acceptance. The others are techniques or approaches.'},
{id:'q3',analogy:"After fixing a leaking tap you check that the tap now runs dry (confirmation). Then you run every other tap and look at the ceiling below for new damp patches (regression).",k:'K2',ch:2,stem:'What distinguishes confirmation testing from regression testing?',options:['Confirmation is automated, regression is manual','Confirmation checks a fix worked; regression checks for unintended side effects','Regression happens only at acceptance level','Confirmation is a non-functional test type'],correct:1,hint:'One looks at the fixed defect, the other at everything around it.',explanation:'After a fix, confirmation re-runs the failed test. Regression tests surrounding functionality for adverse effects.'},
{id:'q4',analogy:"Statement coverage is visiting every room in a house. Branch coverage also means walking through every door both ways. You can visit every room without ever trying some doors.",k:'K2',ch:4,stem:'Which statement about coverage is correct?',options:['100% statement coverage guarantees 100% branch coverage','100% branch coverage guarantees 100% statement coverage','They are always equal','Neither can be measured on code'],correct:1,hint:'Branches include every outcome of every decision.',explanation:'Exercising every branch outcome executes every reachable statement. The reverse fails, e.g. an if without an else.'},
{id:'q5',analogy:"A cinema checks age at the 18 line. Staff slip up right at the cutoff, so you test the person just under it and the person exactly on it, not someone aged 40.",k:'K3',ch:4,stem:'An age field accepts 18 to 65 inclusive. Using 2-value boundary value analysis, which values do you test?',options:['17, 18, 65, 66','18, 19, 64, 65','17, 18, 19, 65, 66','0, 18, 65, 100'],correct:0,hint:'2-value BVA: each boundary plus its closest neighbor in the adjacent partition.',explanation:'Boundaries are 18 and 65; the closest invalid neighbors are 17 and 66. 3-value BVA would also add 19 and 64.'},
{id:'q6',analogy:"Commute estimate: best 20 min, typical 30, worst 60 in traffic. (20 + 4x30 + 60) / 6 = 33 min, a more honest answer than a flat 30.",k:'K3',ch:5,stem:'Estimates: optimistic 6, most likely 12, pessimistic 24 days. What is the three-point estimate (a+4m+b)/6?',options:['12','13','14','15'],correct:1,hint:'Weight the most likely value four times.',explanation:'(6 + 4 x 12 + 24) / 6 = 78 / 6 = 13 days.'},
{id:"q7",k:"K3",ch:4,analogy:"A canteen charges by age band: child, student, adult. If the till is right for one child ticket, it is assumed right for every child, so you test one ticket per band, not every possible age.",stem:"A shop discount applies to valid order totals as follows: 1.00 to 99.99 gets no discount, 100.00 to 499.99 gets 5%, and 500.00 or more gets 10%. Using equivalence partitioning, what is the minimum number of test cases to cover all valid partitions?",options:["2", "3", "4", "6"],correct:1,hint:"One representative value per partition is enough.",explanation:"There are three valid equivalence partitions, so at least one test case per partition is needed: 3. Invalid partitions (such as zero or negative totals) would need additional tests."},
{id:"q8",k:"K3",ch:4,analogy:"Three yes/no questions before a trip (rain? beach? flight?) give 8 possible packing lists. The table writes them all down so no combination is forgotten.",stem:"A discount rule depends on three independent true/false conditions: member, coupon, first order. How many rules (columns) does the full decision table have before any collapsing?",options:["3", "6", "8", "9"],correct:2,hint:"Each extra condition doubles the number of combinations.",explanation:"With 3 binary conditions there are 2 x 2 x 2 = 8 combinations. Collapsing merges rules where a condition does not affect the outcome."},
{id:"q9",k:"K2",ch:4,analogy:"In a lift, pressing Up does different things when the doors are open, closing, or the car is moving. Same input, different outcome, because the state is different.",stem:"Which statement about state transition testing is correct?",options:["Test cases are derived from states, events, transitions and actions", "It can only be applied to source code", "It ignores the history of earlier events", "It is a white-box technique based on branches"],correct:0,hint:"Think of a system that behaves differently depending on what happened before.",explanation:"State transition testing is a black-box technique: the same event can produce different results depending on the current state, and tests exercise states and transitions."},
{id:"q10",k:"K3",ch:4,analogy:"A speed camera triggers at 100 km/h. Bugs hide at the edge (less-than vs less-or-equal), so you check 99, 100 and 101 rather than a random 60.",stem:"A field accepts integers from 1 to 100 inclusive. Using 3-value boundary value analysis, how many test values are needed?",options:["2", "4", "6", "8"],correct:2,hint:"Each boundary gets itself plus a neighbor on each side.",explanation:"Boundary 1 gives 0, 1, 2 and boundary 100 gives 99, 100, 101. That is 6 distinct values."},
{id:"q11",k:"K2",ch:5,analogy:"Building a house: a cracked foundation is a product risk (the thing itself is flawed). The builder quitting halfway is a project risk (the way it is being delivered).",stem:"Which of the following is a project risk rather than a product risk?",options:["The reporting module calculates totals incorrectly", "A key test analyst leaves the project part-way through", "The system responds too slowly under peak load", "The user interface confuses new users"],correct:1,hint:"Project risks concern how the project is managed and resourced, not the quality of the product.",explanation:"Staff loss affects project delivery. Incorrect calculations, poor performance and confusing UI are product risks about the quality of the test object."},
{id:"q12",k:"K1",ch:3,stem:"Which review type is the most formal?",options:["Informal review", "Walkthrough", "Technical review", "Inspection"],correct:3,hint:"It follows a defined process with roles and exit criteria.",explanation:"CTFL v4.0 lists informal review, walkthrough, technical review and inspection; inspection is the most formal."},
{id:"q13",k:"K2",ch:3,stem:"Which is an advantage of static testing over dynamic testing?",options:["It needs an executable build", "It can find defects in work products, such as requirements, before any code exists", "It identifies performance bottlenecks", "It makes dynamic testing unnecessary"],correct:1,hint:"Static testing does not run the software.",explanation:"Static testing examines work products without executing them, so defects such as ambiguous requirements are found early and cheaply. It complements, not replaces, dynamic testing."},
{id:"q14",k:"K1",ch:6,stem:"Which is a potential benefit of test automation?",options:["It removes the need for test design", "Greater consistency and fewer human errors in repetitive tasks", "It guarantees defect-free software", "It needs no maintenance"],correct:1,hint:"Machines are good at repeating the same thing exactly.",explanation:"Benefits include time savings on repetitive work, greater consistency and more objective assessment. Automation still needs design and maintenance."},
{id:"q15",k:"K2",ch:6,stem:"Which is a typical risk of introducing test automation?",options:["Unrealistic expectations about what it will deliver", "It always reduces coverage", "Tools cannot execute tests", "Defect reports become impossible"],correct:0,hint:"Think about expectations versus effort.",explanation:"Typical risks include unrealistic expectations, underestimating the effort to build and maintain testware, and over-reliance on the tool."}];
export const CHUNKS=[
{id:'c1',min:15,title:'Review 8 concept cards',note:'Due today, mostly Chapter 1 and 2',href:'/maps',cta:'Open maps'},
{id:'c2',min:15,title:'Answer 6 mixed K1 to K3 questions',note:'Timed against the K-level target',href:'/quiz',cta:'Start quiz'},
{id:'c3',min:15,title:'Read the Chapter 4 mind-map',note:'Your lowest accuracy chapter',href:'/maps',cta:'Open chapter'}];

export const BUGS:{id:string;ch:number;k:K;claim:string;options:string[];flaw:number;trap:string;correction:string}[]=[
{
"id": "b1",
"ch": 4,
"k": "K2",
"claim": "Our suite reached 100% statement coverage, so every decision outcome (true and false) has been tested.",
"options": [
"Statement coverage ignores which tests were executed",
"100% statement coverage does not guarantee every branch outcome was exercised, for example an if without an else",
"The claim is only wrong for compiled languages",
"Branch coverage is a weaker criterion than statement coverage"
],
"flaw": 1,
"trap": "Coverage-type swap",
"correction": "100% branch coverage guarantees 100% statement coverage, but not the other way around."
},
{
"id": "b2",
"ch": 1,
"k": "K2",
"claim": "We ran 500 tests and found no defects, so the software is defect-free and can ship.",
"options": [
"The tests were probably badly written",
"Testing can show the presence of defects but cannot prove their absence",
"500 tests is always too few for a release",
"Defect-free software never needs testing"
],
"flaw": 1,
"trap": "Absolute-claim trap",
"correction": "Testing reduces the probability of undiscovered defects but is not proof of correctness (testing principle 1)."
},
{
"id": "b3",
"ch": 2,
"k": "K2",
"claim": "The login defect was fixed and the failed test now passes, so we know no other function was affected.",
"options": [
"Confirmation testing only checks the fix; regression testing is needed to look for side effects",
"The failed test should have been deleted",
"Passing tests are proof that nothing else changed",
"Only acceptance testing can find side effects"
],
"flaw": 0,
"trap": "Test-type mix-up",
"correction": "Confirmation testing verifies the fix itself. Regression testing checks for unintended effects elsewhere."
},
{
"id": "b4",
"ch": 4,
"k": "K3",
"claim": "The valid range is 18 to 65, so boundary value analysis needs only the values 18 and 65.",
"options": [
"Boundary value analysis never uses valid values",
"2-value BVA also needs the closest value in each adjacent partition, here 17 and 66",
"Only 19 and 64 are boundaries",
"Boundary values cannot be applied to ages"
],
"flaw": 1,
"trap": "Half-answer trap",
"correction": "2-value BVA tests each boundary and its nearest neighbor in the adjacent partition: 17, 18, 65, 66."
},
{
"id": "b5",
"ch": 1,
"k": "K2",
"claim": "Testers should fix the defects they find, because debugging is simply part of testing.",
"options": [
"Testers are not allowed to read code",
"Debugging, finding and removing the cause of a failure, is a development activity; testing reveals the failures",
"Debugging only happens after release",
"Testing and debugging are the same thing"
],
"flaw": 1,
"trap": "Terminology swap",
"correction": "Testing triggers failures or finds defects. Debugging locates and removes their causes, and confirmation testing then checks the fix."
},
{
"id": "b6",
"ch": 5,
"k": "K2",
"claim": "A risk's level is decided by its impact alone, so we always test the highest-impact area first.",
"options": [
"Impact is irrelevant to risk",
"Risk level combines likelihood and impact, and the word 'alone' makes the claim wrong",
"Likelihood alone decides risk level",
"Risk level cannot be estimated"
],
"flaw": 1,
"trap": "Single-factor trap",
"correction": "Risk level is determined by likelihood and impact together; priorities come from that combination."
}
];

QS.push(...([
{
"id": "q16",
"k": "K1",
"ch": 1,
"set": "A",
"stem": "Which of the following best describes a failure?",
"options": [
"A human mistake made while writing code",
"A flaw in a work product that may cause wrong behavior",
"An event in which a component or system does not perform a required function",
"The earliest condition that created a defect"
],
"correct": 2,
"hint": "A failure is what is observed when the software runs.",
"explanation": "A human error can introduce a defect; executing the defect may cause a failure, which is the observable event of a required function not being performed."
},
{
"id": "q17",
"k": "K2",
"ch": 1,
"set": "B",
"analogy": "A recipe typo (defect) makes the cake taste salty (failure). The cook's slip while copying the recipe was the error.",
"stem": "A payment screen shows a wrong total. The developer finds that a tax rate constant was mistyped in the code. Which pairing is correct?",
"options": [
"Wrong total is the defect; mistyped constant is the failure",
"Wrong total is the failure; mistyped constant is the defect",
"Wrong total is the error; mistyped constant is the failure",
"Wrong total is the root cause; mistyped constant is the error"
],
"correct": 1,
"hint": "Which one do users see, and which one lives in the code?",
"explanation": "The observable wrong behavior is the failure. The incorrect constant in the code is the defect, introduced by a human error (the typo)."
},
{
"id": "q18",
"k": "K2",
"ch": 1,
"set": "C",
"stem": "Which statement correctly contrasts testing with quality assurance?",
"options": [
"Quality assurance is product-oriented and corrective; testing is process-oriented and preventive",
"Testing is product-oriented and corrective (quality control); quality assurance is process-oriented and preventive",
"Both are purely preventive",
"Both are purely corrective"
],
"correct": 1,
"hint": "One looks at the product, the other at the process.",
"explanation": "Testing is a quality control activity: product-oriented and corrective. Quality assurance focuses on processes and prevention."
},
{
"id": "q19",
"k": "K1",
"ch": 1,
"set": "D",
"stem": "Which testing principle says that repeating the same tests over and over finds fewer and fewer new defects?",
"options": [
"Defects cluster together",
"Tests wear out",
"Exhaustive testing is impossible",
"Early testing saves time and money"
],
"correct": 1,
"hint": "Think about tests losing their power over time.",
"explanation": "Principle 5, tests wear out: if the same tests are repeated, they stop finding new defects, so they must be reviewed and updated."
},
{
"id": "q20",
"k": "K2",
"ch": 1,
"set": "A",
"stem": "The principle 'defects cluster together' suggests what for test effort?",
"options": [
"Spread effort evenly over all modules",
"Focus more testing on the small number of modules likely to contain most defects",
"Stop testing a module once one defect is found",
"Test only the module changed last"
],
"correct": 1,
"hint": "A few modules usually hold most of the defects.",
"explanation": "Defects tend to concentrate in a small number of modules, so risk-based focus on those areas is more effective than even coverage."
},
{
"id": "q21",
"k": "K1",
"ch": 2,
"set": "B",
"stem": "Which test level focuses on interfaces and interactions between components?",
"options": [
"Component testing",
"Component integration testing",
"Acceptance testing",
"Regression testing"
],
"correct": 1,
"hint": "The name says what is integrated.",
"explanation": "Component integration testing focuses on the interfaces and interactions between components. Regression testing is a change-related test type, not a level."
},
{
"id": "q22",
"k": "K2",
"ch": 2,
"set": "C",
"stem": "Which statement about non-functional testing is correct?",
"options": [
"It evaluates characteristics such as performance efficiency, usability and security",
"It can only be performed at acceptance level",
"It does not need test cases",
"It checks only what the system does, never how well"
],
"correct": 0,
"hint": "Functional is about what, non-functional is about how well.",
"explanation": "Non-functional testing evaluates quality characteristics (for example performance efficiency, usability, reliability, security) and can be done at any test level."
},
{
"id": "q23",
"k": "K1",
"ch": 2,
"set": "D",
"stem": "Which of the following is a trigger for maintenance testing?",
"options": [
"Migration of the system to a new platform",
"Completion of component testing",
"Approval of the test plan",
"Start of exploratory testing"
],
"correct": 0,
"hint": "Maintenance happens after a system is in operation.",
"explanation": "Triggers for maintenance testing are modification, migration and retirement of the system."
},
{
"id": "q24",
"k": "K2",
"ch": 2,
"set": "A",
"stem": "In acceptance test-driven development (ATDD), when are acceptance tests created?",
"options": [
"Before implementation, derived from the acceptance criteria",
"After the release",
"Only by developers after coding",
"Only during operational acceptance testing"
],
"correct": 0,
"hint": "ATDD is a test-first approach.",
"explanation": "ATDD derives acceptance tests from acceptance criteria during story refinement, before the story is implemented."
},
{
"id": "q25",
"k": "K1",
"ch": 3,
"set": "B",
"stem": "Which review role records anomalies, decisions and findings raised during the review meeting?",
"options": [
"Author",
"Moderator",
"Scribe",
"Manager"
],
"correct": 2,
"hint": "Also called the recorder.",
"explanation": "The scribe (recorder) collates anomalies from reviewers and records decisions and new anomalies found during the review meeting."
},
{
"id": "q26",
"k": "K1",
"ch": 3,
"set": "C",
"stem": "In which review activity do reviewers review the work product on their own and note anomalies?",
"options": [
"Planning",
"Review initiation",
"Individual review",
"Fixing and reporting"
],
"correct": 2,
"hint": "Each reviewer works alone at this point.",
"explanation": "Review activities are planning, review initiation, individual review, communication and analysis, and fixing and reporting. Reviewers find anomalies independently during individual review."
},
{
"id": "q27",
"k": "K2",
"ch": 3,
"set": "D",
"stem": "Which is a typical success factor for reviews?",
"options": [
"Reviewing very large work products in a single session",
"Defining clear objectives and measurable exit criteria",
"Using the review to evaluate the author's performance",
"Skipping planning for informal reviews"
],
"correct": 1,
"hint": "Think about what makes reviews effective and safe for participants.",
"explanation": "Clear objectives and measurable exit criteria are success factors. Evaluating participants should never be an objective, and work products should be reviewed in small chunks."
},
{
"id": "q28",
"k": "K2",
"ch": 3,
"set": "A",
"stem": "Which statement correctly distinguishes static analysis from dynamic testing?",
"options": [
"Static analysis requires executing the code; dynamic testing does not",
"Static analysis can find defects such as unreachable code without executing the code",
"Dynamic testing can only find defects in requirements",
"Static analysis applies only to test cases"
],
"correct": 1,
"hint": "Which of the two runs the software?",
"explanation": "Static analysis evaluates work products without executing them, so it can find defects such as unreachable code or undefined variables. Dynamic testing executes the test object and reveals failures."
},
{
"id": "q29",
"k": "K1",
"ch": 4,
"set": "B",
"stem": "Which technique divides data into partitions that the test object is expected to process in the same way?",
"options": [
"Equivalence partitioning",
"Statement testing",
"Error guessing",
"Checklist-based testing"
],
"correct": 0,
"hint": "The name contains the answer.",
"explanation": "Equivalence partitioning divides data into partitions expected to be handled alike, so one value can represent each partition."
},
{
"id": "q30",
"k": "K2",
"ch": 4,
"set": "C",
"analogy": "A food critic wandering a market follows leads and takes notes as they learn, with a time limit and a goal, instead of ticking items off a fixed menu.",
"stem": "Which statement about exploratory testing is correct?",
"options": [
"Test design, execution and learning happen at the same time, often guided by a test charter",
"All test cases must be fully written before any execution",
"It cannot be time-boxed",
"It is a white-box technique"
],
"correct": 0,
"hint": "Think of learning while testing.",
"explanation": "In exploratory testing, tests are designed, executed and evaluated while learning about the test object, often in time-boxed sessions guided by a charter."
},
{
"id": "q31",
"k": "K2",
"ch": 4,
"set": "D",
"stem": "In decision table testing, how is coverage measured?",
"options": [
"Feasible columns exercised by at least one test, divided by total feasible columns",
"Conditions divided by actions",
"States visited divided by total states",
"Branches executed divided by total branches"
],
"correct": 0,
"hint": "A decision table is made of columns (rules).",
"explanation": "Decision table coverage is the number of columns exercised by at least one test case divided by the total number of feasible columns."
},
{
"id": "q32",
"k": "K1",
"ch": 4,
"set": "A",
"stem": "Which of the following is a white-box technique?",
"options": [
"Branch testing",
"Boundary value analysis",
"Exploratory testing",
"Decision table testing"
],
"correct": 0,
"hint": "White-box uses the structure of the code.",
"explanation": "Statement testing and branch testing are white-box techniques. The others are black-box or experience-based."
},
{
"id": "q33",
"k": "K2",
"ch": 4,
"set": "B",
"stem": "In the three Cs of a user story, what does Confirmation refer to?",
"options": [
"The acceptance criteria and tests that confirm the story is done",
"The written description on the card",
"The discussion between stakeholders",
"The sign-off by the project manager"
],
"correct": 0,
"hint": "The three Cs are Card, Conversation, Confirmation.",
"explanation": "Card is the story description, Conversation is the discussion, and Confirmation is the acceptance criteria and tests that confirm the story is complete."
},
{
"id": "q34",
"k": "K1",
"ch": 5,
"set": "C",
"stem": "Which of the following is an example of an exit criterion?",
"options": [
"The test environment is available",
"Planned tests have been executed and all critical defects are resolved or accepted",
"Test data has been prepared",
"Testers have been trained"
],
"correct": 1,
"hint": "Exit criteria say when testing can stop.",
"explanation": "Exit criteria include planned tests executed, coverage reached and defect thresholds met. Environment, data and resources are typical entry criteria."
},
{
"id": "q35",
"k": "K1",
"ch": 5,
"set": "D",
"stem": "Which estimation technique is iterative, with experts estimating separately and then discussing deviations until consensus?",
"options": [
"Ratio-based estimation",
"Extrapolation",
"Wideband Delphi",
"Three-point estimation"
],
"correct": 2,
"hint": "It is named after an oracle.",
"explanation": "Wideband Delphi is an iterative, expert-based technique: experts estimate in isolation, discuss out-of-range deviations, and re-estimate until they reach consensus."
},
{
"id": "q36",
"k": "K2",
"ch": 5,
"set": "A",
"analogy": "In a building you run lots of cheap, fast checks on every brick (unit level) and only a few slow, costly walkthroughs of the finished house (UI level).",
"stem": "In the test pyramid model, which is typically true of the lower layers compared with the top layer?",
"options": [
"They have fewer tests that are slower and more expensive",
"They have more tests that are faster and more isolated",
"They always test the user interface",
"They can only be run manually"
],
"correct": 1,
"hint": "Low layers are small and fast.",
"explanation": "The pyramid shows that lower layers contain more small, fast, isolated tests, while the top layer has fewer, slower, broader tests."
},
{
"id": "q37",
"k": "K1",
"ch": 5,
"set": "B",
"stem": "Which information is typically included in a defect report?",
"options": [
"Expected and actual results, severity and the test environment",
"Only the defect title",
"The name of the developer who must fix it",
"The estimated cost of the fix"
],
"correct": 0,
"hint": "A good report lets someone reproduce the problem.",
"explanation": "A defect report typically includes identifier, title, test object and environment, a description with steps to reproduce, expected and actual results, severity, priority and status."
},
{
"id": "q38",
"k": "K1",
"ch": 6,
"set": "C",
"stem": "Which category of tools is used to run tests automatically and measure coverage?",
"options": [
"Test management tools",
"Test execution and coverage tools",
"Static analysis tools",
"Collaboration tools"
],
"correct": 1,
"hint": "The category name says what it does.",
"explanation": "Test execution and coverage tools run tests and measure coverage. Management tools organize testing, and static tools analyze work products without executing them."
},
{
"id": "q39",
"k": "K2",
"ch": 6,
"set": "D",
"analogy": "Switching on autopilot does not remove the need for a pilot who knows what to check and when to take over.",
"stem": "Why is over-reliance on a test automation tool a risk?",
"options": [
"The tool can replace the judgment needed to design and evaluate tests",
"Tools always make testing slower",
"Tools cannot run regression tests",
"Tools remove all maintenance work"
],
"correct": 0,
"hint": "Tools support testers, they do not replace them.",
"explanation": "Over-reliance on a tool can lead teams to skip the thinking needed for good test design and evaluation. Automation still needs design and maintenance."
}
] as typeof QS));
const DIFF:Record<string,number>={"q1": 1, "q2": 1, "q3": 2, "q4": 2, "q5": 3, "q6": 3, "q7": 2, "q8": 2, "q9": 2, "q10": 3, "q11": 2, "q12": 1, "q13": 2, "q14": 1, "q15": 2, "q16": 1, "q17": 3, "q18": 2, "q19": 1, "q20": 2, "q21": 1, "q22": 2, "q23": 1, "q24": 2, "q25": 1, "q26": 1, "q27": 2, "q28": 3, "q29": 1, "q30": 2, "q31": 3, "q32": 1, "q33": 2, "q34": 2, "q35": 2, "q36": 2, "q37": 1, "q38": 1, "q39": 3};
/** Difficulty 1 easy, 2 medium, 3 hard (independent of the K level). */
QS.forEach(q=>{q.d=DIFF[q.id]??({K1:1,K2:2,K3:3} as Record<string,number>)[q.k]});
