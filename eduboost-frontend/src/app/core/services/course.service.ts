import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly SEED_VERSION = 'v5'; // bump this to force re-seed

  constructor() { if (this.isBrowser()) this.ensureSeed(); }

  private isBrowser() { return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'; }

  private ensureSeed() {
    if (!this.isBrowser()) return;

    // Force re-seed if version mismatch
    if (localStorage.getItem('eduboost_seed_ver') !== this.SEED_VERSION) {
      localStorage.removeItem('eduboost_courses');
      localStorage.removeItem('eduboost_feedback_1');
      localStorage.removeItem('eduboost_feedback_2');
      localStorage.removeItem('eduboost_feedback_3');
      localStorage.removeItem('eduboost_feedback_4');
      localStorage.removeItem('eduboost_feedback_5');
      localStorage.removeItem('eduboost_feedback_6');
      localStorage.setItem('eduboost_seed_ver', this.SEED_VERSION);
    }

    if (!localStorage.getItem('eduboost_courses')) {
      const courses = [
        {
          id: 1, title: 'Introduction to Mathematics',
          description: 'Master the fundamentals of algebra, geometry and calculus. Designed for learners who want to build a solid mathematical foundation.',
          difficulty: 'Beginner', category: 'Mathematics', duration: '12h',
          image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
          chapters: [
            { id: 1, title: 'Numbers & Operations', content: 'Explore integers, fractions, decimals and the basic operations that form the backbone of all mathematics.', videos: [{ id: 1, chapter_id: 1, title: 'Introduction to Numbers', url: 'https://www.youtube.com/watch?v=example1', duration: 12, order: 1 }, { id: 2, chapter_id: 1, title: 'Basic Arithmetic Operations', url: 'https://www.youtube.com/watch?v=example2', duration: 15, order: 2 }] },
            { id: 2, title: 'Algebra Basics', content: 'Understand variables, expressions and equations. Solve linear and quadratic equations with confidence.', videos: [{ id: 1, chapter_id: 2, title: 'Variables & Expressions', url: 'https://www.youtube.com/watch?v=example3', duration: 18, order: 1 }] },
            { id: 3, title: 'Geometry Fundamentals', content: 'Learn about shapes, angles, triangles, circles and how to calculate area and perimeter.', videos: [] },
            { id: 4, title: 'Introduction to Calculus', content: 'Get your first look at limits, derivatives and integrals — the language of change and motion.', videos: [] },
          ],
          quizzes: [
            { id: 1, title: 'Numbers & Algebra Quiz', questions: [
              { q: 'What is 7 × 8?', a: ['54','56','58','60'], correct: 1 },
              { q: 'Solve: 2x + 4 = 12. What is x?', a: ['3','4','5','6'], correct: 1 },
              { q: 'What is the area of a rectangle 5m × 3m?', a: ['8m²','15m²','20m²','25m²'], correct: 1 },
            ]},
            { id: 2, title: 'Geometry & Calculus Quiz', questions: [
              { q: 'How many degrees are in a triangle?', a: ['90°','180°','270°','360°'], correct: 1 },
              { q: 'What is the derivative of x²?', a: ['x','2x','x²','2'], correct: 1 },
            ]},
          ],
          createdBy: 1
        },
        {
          id: 2, title: 'Web Design with CSS',
          description: 'Build stunning, responsive web interfaces with modern CSS techniques including Flexbox, Grid and animations.',
          difficulty: 'Intermediate', category: 'Design', duration: '8h',
          image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&q=80',
          chapters: [
            { id: 1, title: 'CSS Selectors & Specificity', content: 'Master all selector types — class, ID, attribute, pseudo-class and pseudo-element. Understand how browsers resolve specificity conflicts.', videos: [{ id: 1, chapter_id: 1, title: 'CSS Selectors Overview', url: 'https://www.youtube.com/watch?v=example4', duration: 20, order: 1 }] },
            { id: 2, title: 'Flexbox Layout', content: 'Build one-dimensional layouts effortlessly. Align, distribute and reorder elements with the power of Flexbox.', videos: [] },
            { id: 3, title: 'CSS Grid', content: 'Create complex two-dimensional layouts with CSS Grid. Define rows, columns, gaps and place items precisely.', videos: [] },
            { id: 4, title: 'Animations & Transitions', content: 'Bring your UI to life with smooth CSS transitions, keyframe animations and transform effects.', videos: [] },
            { id: 5, title: 'Responsive Design', content: 'Use media queries and fluid units to make your sites look perfect on mobile, tablet and desktop.', videos: [] },
          ],
          quizzes: [
            { id: 1, title: 'Selectors & Flexbox Quiz', questions: [
              { q: 'Which CSS property sets the direction of flex items?', a: ['flex-wrap','flex-flow','flex-direction','align-items'], correct: 2 },
              { q: 'What does "em" unit relate to?', a: ['Viewport width','Parent font-size','Root font-size','Screen height'], correct: 1 },
              { q: 'Which property makes a grid container?', a: ['display:flex','display:grid','display:block','display:inline'], correct: 1 },
            ]},
          ],
          createdBy: 1
        },
        {
          id: 3, title: 'Python Programming',
          description: 'Learn Python from scratch with hands-on projects. Covers data structures, functions, OOP and practical applications.',
          difficulty: 'Beginner', category: 'Programming', duration: '20h',
          image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
          chapters: [
            { id: 1, title: 'Variables & Data Types', content: 'Understand Python\'s dynamic typing. Work with strings, integers, floats, booleans and None.' },
            { id: 2, title: 'Control Flow', content: 'Master if/elif/else conditions, while loops and for loops. Learn to use break, continue and range().', videos: [] },
            { id: 3, title: 'Functions & Modules', content: 'Write reusable functions with parameters and return values. Import built-in and third-party modules.', videos: [] },
            { id: 4, title: 'Lists, Tuples & Dictionaries', content: 'Work with Python\'s core data structures. Slice, iterate, sort and transform collections efficiently.', videos: [] },
            { id: 5, title: 'Object-Oriented Programming', content: 'Define classes, create objects, use inheritance and encapsulation to write clean, maintainable code.', videos: [] },
            { id: 6, title: 'File I/O & Error Handling', content: 'Read and write files, handle exceptions gracefully with try/except and create robust programs.', videos: [] },
          ],
          quizzes: [
            { id: 1, title: 'Python Basics Quiz', questions: [
              { q: 'What keyword defines a function in Python?', a: ['function','define','def','func'], correct: 2 },
              { q: 'What is the output of print(type(3.14))?', a: ["<class 'int'>","<class 'float'>","<class 'str'>","<class 'num'>"], correct: 1 },
              { q: 'How do you create a list in Python?', a: ['{}','()','[]','<>'], correct: 2 },
              { q: 'What does len([1,2,3]) return?', a: ['0','1','2','3'], correct: 3 },
            ]},
            { id: 2, title: 'OOP & Advanced Quiz', questions: [
              { q: 'What keyword creates a class?', a: ['obj','class','type','struct'], correct: 1 },
              { q: 'What is __init__ in Python?', a: ['A loop','A constructor','A decorator','A module'], correct: 1 },
            ]},
          ],
          createdBy: 1
        },
        {
          id: 4, title: 'Data Science Fundamentals',
          description: 'Analyze real-world data and build predictive models with Python, Pandas, NumPy and Scikit-learn.',
          difficulty: 'Advanced', category: 'Data Science', duration: '24h',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
          chapters: [
            { id: 1, title: 'NumPy & Pandas', content: 'Manipulate arrays with NumPy and tabular data with Pandas DataFrames. Perform fast vectorized operations.', videos: [] },
            { id: 2, title: 'Data Visualization', content: 'Create insightful charts with Matplotlib and Seaborn. Visualize distributions, correlations and trends.', videos: [] },
            { id: 3, title: 'Data Cleaning', content: 'Handle missing values, outliers and inconsistent formats. Prepare data for modelling with confidence.', videos: [] },
            { id: 4, title: 'Machine Learning Basics', content: 'Understand supervised vs unsupervised learning. Train your first models with Scikit-learn.', videos: [] },
          ],
          quizzes: [
            { id: 1, title: 'Data Science Quiz', questions: [
              { q: 'What library is used for data manipulation in Python?', a: ['NumPy','Pandas','Matplotlib','Seaborn'], correct: 1 },
              { q: 'What is a DataFrame?', a: ['A chart type','A 2D data structure','A machine learning model','A Python loop'], correct: 1 },
            ]},
          ],
          createdBy: 1
        },
        {
          id: 5, title: 'English Communication',
          description: 'Boost your professional English speaking and writing skills for the modern workplace.',
          difficulty: 'Intermediate', category: 'Languages', duration: '16h',
          image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
          chapters: [
            { id: 1, title: 'Business Writing Essentials', content: 'Craft clear, concise professional emails, reports and memos that get results.', videos: [] },
            { id: 2, title: 'Presentation Skills', content: 'Structure compelling presentations, use visual aids effectively and engage your audience.', videos: [] },
            { id: 3, title: 'Meeting & Negotiation Language', content: 'Lead meetings, negotiate confidently and use diplomatic language to resolve conflict.', videos: [] },
          ],
          quizzes: [
            { id: 1, title: 'English Skills Quiz', questions: [
              { q: 'Which phrase is most professional in an email?', a: ['Hey!','Dear Sir/Madam,','Yo,','What\'s up,'], correct: 1 },
              { q: 'What does "FYI" stand for?', a: ['For Your Interest','For Your Information','From Your Inbox','Find Your Input'], correct: 1 },
            ]},
          ],
          createdBy: 1
        },
        {
          id: 6, title: 'Digital Marketing',
          description: 'Grow your brand with proven SEO, social media, content strategy and analytics techniques.',
          difficulty: 'Beginner', category: 'Marketing', duration: '10h',
          image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c836?w=800&q=80',
          chapters: [
            { id: 1, title: 'SEO Fundamentals', content: 'Understand how search engines index pages. Optimize titles, meta descriptions and on-page content.', videos: [] },
            { id: 2, title: 'Social Media Strategy', content: 'Build an audience on Instagram, LinkedIn and X. Create content calendars and track engagement.', videos: [] },
            { id: 3, title: 'Email Marketing', content: 'Design effective email campaigns, segment audiences and measure open and click rates.', videos: [] },
            { id: 4, title: 'Analytics & Reporting', content: 'Use Google Analytics to track traffic, conversions and user behaviour. Make data-driven decisions.', videos: [] },
          ],
          quizzes: [
            { id: 1, title: 'Marketing Fundamentals Quiz', questions: [
              { q: 'What does SEO stand for?', a: ['Search Engine Optimization','Social Engagement Online','Site Efficiency Order','Search Entry Output'], correct: 0 },
              { q: 'What metric measures email campaign success?', a: ['Bounce rate','Click-through rate','Page views','Impressions'], correct: 1 },
            ]},
          ],
          createdBy: 1
        },
      ];
      localStorage.setItem('eduboost_courses', JSON.stringify(courses));
    }

    // Seed rich feedback for each course
    this.seedFeedbacks();

    if (!localStorage.getItem('eduboost_attempts')) localStorage.setItem('eduboost_attempts', '[]');
    if (!localStorage.getItem('eduboost_progress')) localStorage.setItem('eduboost_progress', '{}');
  }

  private seedFeedbacks() {
    const feedbackData: Record<number, any[]> = {
      1: [
        { id: 1001, userId: 99, userName: 'Sophie Martin', avatar: 'SM', rating: 5, comment: 'Absolutely fantastic course! The explanations are crystal clear and the progression from basics to calculus feels very natural. Highly recommend for any beginner.', createdAt: '12 Jan 2025' },
        { id: 1002, userId: 98, userName: 'Ahmed Benali', avatar: 'AB', rating: 4, comment: 'Very well structured content. I especially loved the algebra chapter — explained much better than my university course. Would love more practice exercises.', createdAt: '18 Feb 2025' },
        { id: 1003, userId: 97, userName: 'Lina Dubois', avatar: 'LD', rating: 5, comment: 'Perfect for building confidence in maths. I was always scared of algebra and this course changed everything for me. Thank you!', createdAt: '03 Mar 2025' },
      ],
      2: [
        { id: 2001, userId: 99, userName: 'Carlos Reyes', avatar: 'CR', rating: 5, comment: 'The CSS Grid chapter alone is worth the entire course. I finally understand how to build real layouts without hacks. Amazing content!', createdAt: '07 Feb 2025' },
        { id: 2002, userId: 98, userName: 'Emma Wilson', avatar: 'EW', rating: 4, comment: 'Great explanations of Flexbox and Grid. The animations chapter was a nice bonus. A few more real-world examples would make it perfect.', createdAt: '22 Mar 2025' },
      ],
      3: [
        { id: 3001, userId: 99, userName: 'Youssef Khalil', avatar: 'YK', rating: 5, comment: 'Best Python course I\'ve found! Goes from absolute zero to OOP in a logical, well-paced way. The hands-on approach really helped it stick.', createdAt: '10 Jan 2025' },
        { id: 3002, userId: 98, userName: 'Marie Fontaine', avatar: 'MF', rating: 5, comment: 'I tried several Python courses before this one and none clicked. This one explained everything so clearly. I wrote my first real script after chapter 3!', createdAt: '25 Feb 2025' },
        { id: 3003, userId: 97, userName: 'Omar Saidi', avatar: 'OS', rating: 4, comment: 'Excellent content. The OOP chapter was very thorough. I\'d love a chapter on decorators and generators as a bonus.', createdAt: '14 Mar 2025' },
      ],
      4: [
        { id: 4001, userId: 99, userName: 'Dr. Fatima Nour', avatar: 'FN', rating: 5, comment: 'As someone transitioning into data science, this course gave me exactly the foundations I needed. The Pandas chapter is outstanding.', createdAt: '05 Mar 2025' },
        { id: 4002, userId: 98, userName: 'Thomas Müller', avatar: 'TM', rating: 4, comment: 'Solid introduction to data science. Would benefit from more ML examples but overall a very strong course.', createdAt: '20 Mar 2025' },
      ],
      5: [
        { id: 5001, userId: 99, userName: 'Aisha Johnson', avatar: 'AJ', rating: 5, comment: 'This course completely transformed how I write professional emails. My manager has noticed the difference. Incredibly practical!', createdAt: '01 Feb 2025' },
      ],
      6: [
        { id: 6001, userId: 99, userName: 'Rania Bouzid', avatar: 'RB', rating: 5, comment: 'Finally a marketing course that doesn\'t waste your time! Very practical, especially the SEO and analytics chapters. Ready to apply everything right away.', createdAt: '15 Jan 2025' },
        { id: 6002, userId: 98, userName: 'Karim Mansour', avatar: 'KM', rating: 4, comment: 'Very good course for beginners. Clear explanations and actionable tips. The social media strategy section is particularly relevant.', createdAt: '28 Feb 2025' },
      ],
    };

    for (const [courseId, feedbacks] of Object.entries(feedbackData)) {
      const key = `eduboost_feedback_${courseId}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(feedbacks));
      }
    }
  }

  private getCourses(): any[] { if (!this.isBrowser()) return []; return JSON.parse(localStorage.getItem('eduboost_courses') || '[]'); }
  private saveCourses(c: any[]) { if (!this.isBrowser()) return; localStorage.setItem('eduboost_courses', JSON.stringify(c)); }

  list() { return this.getCourses(); }
  getCourse(id: number) { return this.getCourses().find((c: any) => c.id == id); }

  createCourse(data: { title: string; description?: string; difficulty?: string; category?: string; duration?: string; image?: string; createdBy: number }) {
    const cs = this.getCourses();
    const id = cs.length ? Math.max(...cs.map((c: any) => c.id)) + 1 : 1;
    const course = { id, ...data, description: data.description || '', difficulty: data.difficulty || 'Beginner', category: data.category || 'General', duration: data.duration || '1h', image: data.image || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&q=80`, chapters: [], quizzes: [] };
    cs.push(course);
    this.saveCourses(cs);
    return course;
  }

  addCourse(title: string, createdBy: number) { return this.createCourse({ title, createdBy }); }

  updateCourse(id: number, data: any) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == id);
    if (c) Object.assign(c, data);
    this.saveCourses(cs);
  }

  deleteCourse(id: number) { let cs = this.getCourses(); cs = cs.filter((x: any) => x.id != id); this.saveCourses(cs); }

  addAttempt(courseId: number, quizId: number, userId: number, score: number) {
    if (!this.isBrowser()) return;
    const attempts = JSON.parse(localStorage.getItem('eduboost_attempts') || '[]');
    attempts.push({ id: attempts.length + 1, courseId, quizId, userId, score, date: Date.now() });
    localStorage.setItem('eduboost_attempts', JSON.stringify(attempts));
    const progress = JSON.parse(localStorage.getItem('eduboost_progress') || '{}');
    const key = `${userId}_${courseId}`;
    const userAttempts = attempts.filter((a: any) => a.userId == userId && a.courseId == courseId);
    const avg = userAttempts.reduce((s: any, a: any) => s + a.score, 0) / userAttempts.length;
    progress[key] = { attempts: userAttempts.length, progress: Math.round(avg) };
    localStorage.setItem('eduboost_progress', JSON.stringify(progress));
  }

  getAttemptsForUser(userId: number) { if (!this.isBrowser()) return []; return JSON.parse(localStorage.getItem('eduboost_attempts') || '[]').filter((a: any) => a.userId == userId); }
  getProgressForUserCourse(userId: number, courseId: number) { if (!this.isBrowser()) return { attempts: 0, progress: 0 }; const p = JSON.parse(localStorage.getItem('eduboost_progress') || '{}'); return p[`${userId}_${courseId}`] || { attempts: 0, progress: 0 }; }
  calcRisk(progress: number) { if (progress < 50) return 'high'; if (progress < 75) return 'medium'; return 'low'; }
  recommendationFor(progress: number) { if (progress < 50) return 'Revoir les chapitres de base et refaire les quizzes simples.'; if (progress < 75) return 'Faire des exercices supplémentaires et revoir les points faibles.'; return 'Continuez comme ça, essayez les quizzes avancés.'; }

  // ── Chapter CRUD ──
  addChapter(courseId: number, data: { title: string; content?: string }) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    if (!c.chapters) c.chapters = [];
    const id = c.chapters.length ? Math.max(...c.chapters.map((ch: any) => ch.id)) + 1 : 1;
    c.chapters.push({ id, title: data.title, content: data.content || '', videos: [] });
    this.saveCourses(cs);
  }

  updateChapter(courseId: number, chapterId: number, data: { title: string; content?: string }) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    const ch = c.chapters?.find((x: any) => x.id == chapterId);
    if (ch) Object.assign(ch, data);
    this.saveCourses(cs);
  }

  deleteChapter(courseId: number, chapterId: number) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    c.chapters = (c.chapters || []).filter((ch: any) => ch.id != chapterId);
    this.saveCourses(cs);
  }

  // ── Video CRUD ──
  addVideo(courseId: number, chapterId: number, data: { title: string; url?: string; duration?: number; order?: number }) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    const ch = c.chapters?.find((x: any) => x.id == chapterId);
    if (!ch) return;
    if (!ch.videos) ch.videos = [];
    const id = ch.videos.length ? Math.max(...ch.videos.map((v: any) => v.id)) + 1 : 1;
    ch.videos.push({ id, chapter_id: chapterId, title: data.title, url: data.url || '', duration: data.duration || 0, order: data.order || 1 });
    this.saveCourses(cs);
  }

  updateVideo(courseId: number, chapterId: number, videoId: number, data: any) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    const ch = c.chapters?.find((x: any) => x.id == chapterId);
    if (!ch) return;
    const v = ch.videos?.find((x: any) => x.id == videoId);
    if (v) Object.assign(v, data);
    this.saveCourses(cs);
  }

  deleteVideo(courseId: number, chapterId: number, videoId: number) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    const ch = c.chapters?.find((x: any) => x.id == chapterId);
    if (!ch) return;
    ch.videos = (ch.videos || []).filter((v: any) => v.id != videoId);
    this.saveCourses(cs);
  }

  // ── Quiz CRUD ──
  addQuiz(courseId: number, data: { title: string; level?: string; questions?: any[] }) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    if (!c.quizzes) c.quizzes = [];
    const id = c.quizzes.length ? Math.max(...c.quizzes.map((q: any) => q.id)) + 1 : 1;
    c.quizzes.push({ id, title: data.title, level: data.level || 'Beginner', questions: data.questions || [] });
    this.saveCourses(cs);
  }

  updateQuiz(courseId: number, quizId: number, data: any) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    const q = c.quizzes?.find((x: any) => x.id == quizId);
    if (q) Object.assign(q, data);
    this.saveCourses(cs);
  }

  deleteQuiz(courseId: number, quizId: number) {
    const cs = this.getCourses();
    const c = cs.find((x: any) => x.id == courseId);
    if (!c) return;
    c.quizzes = (c.quizzes || []).filter((q: any) => q.id != quizId);
    this.saveCourses(cs);
  }

  // ── Feedback CRUD ──
  getFeedbacks(courseId: number): any[] {
    if (!this.isBrowser()) return [];
    return JSON.parse(localStorage.getItem(`eduboost_feedback_${courseId}`) || '[]');
  }

  addFeedback(courseId: number, userId: number, userName: string, avatar: string, rating: number, comment: string) {
    if (!this.isBrowser()) return;
    const feedbacks = this.getFeedbacks(courseId);
    const id = feedbacks.length ? Math.max(...feedbacks.map((f: any) => f.id)) + 1 : 1;
    const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    feedbacks.push({ id, userId, userName, avatar, rating, comment, createdAt: now });
    localStorage.setItem(`eduboost_feedback_${courseId}`, JSON.stringify(feedbacks));
  }

  deleteFeedback(courseId: number, feedbackId: number) {
    if (!this.isBrowser()) return;
    const feedbacks = this.getFeedbacks(courseId).filter((f: any) => f.id != feedbackId);
    localStorage.setItem(`eduboost_feedback_${courseId}`, JSON.stringify(feedbacks));
  }
}
