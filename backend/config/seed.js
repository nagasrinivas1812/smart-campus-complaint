const User = require('../models/User');
const Complaint = require('../models/Complaint');

const seedDemoData = async () => {
    try {
        // Always ensure the single Admin account exists
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = await User.create({
                name: 'Campus Administrator',
                email: 'admin@campus.edu',
                password: 'admin123',
                role: 'admin',
                department: 'Administration',
                phone: '9123456789',
            });
            console.log('✅ Primary Admin account created: admin@campus.edu / admin123');
        }

        const userCount = await User.countDocuments();
        if (userCount > 1) return;

        console.log('🌱 Seeding demo student and initial complaints data...');

        // Create student account
        let student = await User.findOne({ email: 'priya@campus.edu' });
        if (!student) {
            student = await User.create({
                name: 'Priya Sharma',
                email: 'priya@campus.edu',
                password: 'password123',
                role: 'student',
                rollNumber: 'CS-2026-101',
                department: 'Computer Science',
                phone: '9876543210',
            });
        }

        // Create initial complaints
        await Complaint.create([
            {
                title: 'Library Wi-Fi Connectivity Issue',
                category: 'Internet',
                description: 'The Wi-Fi on the 2nd floor of the Central Library keeps disconnecting frequently during study hours.',
                status: 'In Progress',
                student: student._id,
                studentName: student.name,
                studentEmail: student.email,
                adminRemarks: 'IT team has been dispatched to check the access point router.',
                statusHistory: [
                    { status: 'Pending', changedBy: student.name, remark: 'Complaint registered' },
                    { status: 'In Progress', changedBy: admin.name, remark: 'IT team assigned' },
                ],
            },
            {
                title: 'Classroom 302 Projector Flickering',
                category: 'Electrical',
                description: 'The ceiling projector flickers repeatedly during lectures, making slides unreadable.',
                status: 'Pending',
                student: student._id,
                studentName: student.name,
                studentEmail: student.email,
                statusHistory: [
                    { status: 'Pending', changedBy: student.name, remark: 'Complaint registered' },
                ],
            },
            {
                title: 'Broken Bench in Cafeteria',
                category: 'Furniture',
                description: 'One of the benches near the main entrance is wobbly and cracked.',
                status: 'Resolved',
                student: student._id,
                studentName: student.name,
                studentEmail: student.email,
                adminRemarks: 'Maintenance team replaced the bench.',
                statusHistory: [
                    { status: 'Pending', changedBy: student.name, remark: 'Complaint registered' },
                    { status: 'Resolved', changedBy: admin.name, remark: 'Maintenance team replaced the bench.' },
                ],
            },
        ]);

        console.log('✅ Demo accounts seeded successfully:');
        console.log('   Student: priya@campus.edu / password123');
        console.log('   Admin:   admin@campus.edu / admin123');
    } catch (error) {
        console.error('⚠️  Failed to seed demo data:', error.message);
    }
};

module.exports = seedDemoData;

