const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  PASS:', message);
    passed++;
  } else {
    console.error('  FAIL:', message);
    failed++;
  }
}

async function runAllTests() {
  console.log('========================================================');
  console.log('  SMART CAMPUS COMPLAINT BOX - COMPREHENSIVE TEST SUITE  ');
  console.log('========================================================\n');

  // --- 1. AUTHENTICATION & SECURITY TESTS ---
  console.log('>>> 1. Testing Auth & Security...');

  // 1.1 Student Registration validation
  const testEmail = `student_${Date.now()}@campus.edu`;
  const regShortPw = await request('POST', '/api/auth/register', {
    name: 'Short Pw Student',
    email: 'short_' + testEmail,
    password: '123',
    role: 'student'
  });
  assert(regShortPw.status === 400, 'Registration rejects password < 6 characters (Status 400)');

  const regMissing = await request('POST', '/api/auth/register', {
    name: 'Incomplete Student'
  });
  assert(regMissing.status === 400, 'Registration rejects missing required fields (Status 400)');

  const regValid = await request('POST', '/api/auth/register', {
    name: 'Arjun Verma',
    email: testEmail,
    password: 'securePassword123',
    role: 'student',
    rollNumber: 'CS-2026-99',
    department: 'Computer Science'
  });
  assert(regValid.status === 201 && regValid.body.success, 'Valid student registers successfully (Status 201)');

  const regDup = await request('POST', '/api/auth/register', {
    name: 'Duplicate Arjun',
    email: testEmail,
    password: 'securePassword123',
    role: 'student'
  });
  assert(regDup.status === 400, 'Registration rejects duplicate email (Status 400)');

  // 1.2 Student Login
  const loginStudent = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: 'securePassword123'
  });
  assert(loginStudent.status === 200 && loginStudent.body.token, 'Student login succeeds with JWT token');
  const studentToken = loginStudent.body.token;

  const loginWrongPw = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: 'wrongPassword'
  });
  assert(loginWrongPw.status === 401, 'Login rejects incorrect password (Status 401)');

  // 1.3 Admin Login
  const loginAdmin = await request('POST', '/api/auth/login', {
    email: 'admin@campus.edu',
    password: 'admin123'
  });
  assert(loginAdmin.status === 200 && loginAdmin.body.user?.role === 'admin', 'Admin login succeeds with admin role');
  const adminToken = loginAdmin.body.token;

  // 1.4 Get Profile (/api/auth/me)
  const meRes = await request('GET', '/api/auth/me', null, studentToken);
  assert(meRes.status === 200 && meRes.body.user?.email === testEmail, 'GET /api/auth/me returns current user info');

  const meNoToken = await request('GET', '/api/auth/me');
  assert(meNoToken.status === 401, 'GET /api/auth/me blocks unauthenticated requests (Status 401)');

  // 1.5 Update Profile (/api/auth/profile)
  const updateProf = await request('PUT', '/api/auth/profile', {
    name: 'Arjun K. Verma',
    phone: '9876500000',
    department: 'Information Technology'
  }, studentToken);
  assert(updateProf.status === 200 && updateProf.body.user?.name === 'Arjun K. Verma', 'Profile details updated successfully');

  // 1.6 Update Password (/api/auth/password)
  const changePw = await request('PUT', '/api/auth/password', {
    currentPassword: 'securePassword123',
    newPassword: 'newSecurePassword456'
  }, studentToken);
  assert(changePw.status === 200, 'Password updated successfully with valid current password');

  const loginWithNewPw = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: 'newSecurePassword456'
  });
  assert(loginWithNewPw.status === 200, 'Student can login with the newly updated password');
  const freshStudentToken = loginWithNewPw.body.token;

  // --- 2. COMPLAINT CREATION & EVIDENCE TESTS ---
  console.log('\n>>> 2. Testing Complaint Submission & Media Attachments...');

  // 2.1 Photo Evidence Complaint
  const mockPhotoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
  const imgComplaint = await request('POST', '/api/complaints', {
    title: 'Water cooler leaking in Main Block 1st floor',
    description: 'The cold water dispenser tap is continuously dripping creating a puddle.',
    category: 'Infrastructure',
    mediaUrl: mockPhotoBase64,
    mediaType: 'image',
    mediaName: 'water_cooler_leak.jpg'
  }, freshStudentToken);
  assert(imgComplaint.status === 201 && imgComplaint.body.data?.mediaType === 'image', 'Complaint with Photo Evidence created (Status 201)');
  const imgComplaintId = imgComplaint.body.data?._id;

  // 2.2 Video Evidence Complaint
  const mockVideoBase64 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28y...';
  const vidComplaint = await request('POST', '/api/complaints', {
    title: 'Lab 2 AC making rattling noise',
    description: 'AC unit #3 in Computer Lab 2 has a broken fan blade causing severe rattling.',
    category: 'Electrical',
    mediaUrl: mockVideoBase64,
    mediaType: 'video',
    mediaName: 'ac_noise_recording.mp4'
  }, freshStudentToken);
  assert(vidComplaint.status === 201 && vidComplaint.body.data?.mediaType === 'video', 'Complaint with Video Evidence created (Status 201)');
  const vidComplaintId = vidComplaint.body.data?._id;

  // 2.3 Required fields validation
  const invalidComplaint = await request('POST', '/api/complaints', {
    title: ''
  }, freshStudentToken);
  assert(invalidComplaint.status === 400, 'Complaint submission rejects empty title/category (Status 400)');

  // 2.4 Student fetch own complaints
  const myComplaints = await request('GET', '/api/complaints/my', null, freshStudentToken);
  assert(myComplaints.status === 200 && Array.isArray(myComplaints.body.data), 'Student can retrieve their complaints list');
  const hasMyImg = myComplaints.body.data?.some(c => c._id === imgComplaintId && c.mediaName === 'water_cooler_leak.jpg');
  const hasMyVid = myComplaints.body.data?.some(c => c._id === vidComplaintId && c.mediaName === 'ac_noise_recording.mp4');
  assert(hasMyImg && hasMyVid, 'Student complaints include photo and video attachments');

  // --- 3. ADMIN MANAGEMENT, STATUS PERSISTENCE & ANALYTICS ---
  console.log('\n>>> 3. Testing Admin Management, Auto-Save & Analytics...');

  // 3.1 Admin fetch all complaints
  const allComplaints = await request('GET', '/api/admin/complaints', null, adminToken);
  assert(allComplaints.status === 200 && allComplaints.body.data?.length >= 2, 'Admin retrieves all campus complaints');

  // 3.2 Category & Search Filters
  const searchRes = await request('GET', '/api/admin/complaints?search=water+cooler', null, adminToken);
  assert(searchRes.status === 200 && searchRes.body.data?.some(c => c._id === imgComplaintId), 'Admin search query correctly filters complaints');

  const catRes = await request('GET', '/api/admin/complaints?category=Electrical', null, adminToken);
  assert(catRes.status === 200 && catRes.body.data?.every(c => c.category === 'Electrical'), 'Admin category filter correctly matches Electrical tickets');

  // 3.3 Status Change to 'In Progress' with Admin Remark
  const updateToProgress = await request('PUT', `/api/admin/complaints/${imgComplaintId}/status`, {
    status: 'In Progress',
    remark: 'Maintenance technician dispatched with replacement valve'
  }, adminToken);
  assert(updateToProgress.status === 200 && updateToProgress.body.data?.status === 'In Progress', 'Admin updates status to "In Progress"');

  // Verify status in DB persists
  const checkProgress = await request('GET', `/api/complaints/${imgComplaintId}`, null, adminToken);
  assert(checkProgress.body.data?.status === 'In Progress' && checkProgress.body.data?.adminRemarks?.includes('valve'), 'Status change to "In Progress" persisted in DB with remark');

  // 3.4 Status Change to 'Resolved'
  const updateToResolved = await request('PUT', `/api/admin/complaints/${imgComplaintId}/status`, {
    status: 'Resolved',
    remark: 'Valve replaced. Water cooler fully functional.'
  }, adminToken);
  assert(updateToResolved.status === 200 && updateToResolved.body.data?.status === 'Resolved', 'Admin updates status to "Resolved"');

  // 3.5 Admin Analytics endpoint
  const analyticsRes = await request('GET', '/api/admin/analytics', null, adminToken);
  assert(analyticsRes.status === 200 && analyticsRes.body.data?.totalComplaints > 0, 'Admin analytics returns metrics & distribution');

  // 3.6 Admin registered users list
  const usersRes = await request('GET', '/api/admin/users', null, adminToken);
  assert(usersRes.status === 200 && usersRes.body.data?.some(u => u.email === testEmail), 'Admin retrieves registered student list');

  // --- 4. TASK DELETION TESTS ---
  console.log('\n>>> 4. Testing Task Deletion for Student & Admin...');

  // 4.1 Student deletes their video complaint
  const delStudent = await request('DELETE', `/api/complaints/${vidComplaintId}`, null, freshStudentToken);
  assert(delStudent.status === 200, 'Student deletes their complaint successfully (Status 200)');

  const myAfterDel = await request('GET', '/api/complaints/my', null, freshStudentToken);
  assert(!myAfterDel.body.data?.some(c => c._id === vidComplaintId), 'Deleted complaint no longer exists in student list');

  // 4.2 Admin deletes the photo complaint
  const delAdmin = await request('DELETE', `/api/admin/complaints/${imgComplaintId}`, null, adminToken);
  assert(delAdmin.status === 200, 'Admin deletes complaint successfully (Status 200)');

  const allAfterDel = await request('GET', '/api/admin/complaints', null, adminToken);
  assert(!allAfterDel.body.data?.some(c => c._id === imgComplaintId), 'Deleted complaint no longer exists in admin list');

  // --- 5. PERMISSION GUARDS ---
  console.log('\n>>> 5. Testing Permission & Route Guards...');

  const studentAdminRoute = await request('GET', '/api/admin/complaints', null, freshStudentToken);
  assert(studentAdminRoute.status === 403, 'Student is blocked from admin routes (Status 403 Forbidden)');

  console.log('\n========================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
