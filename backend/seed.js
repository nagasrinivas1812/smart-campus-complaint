const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

dotenv.config();

const seedData = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_db';
        console.log(`Connecting to ${uri}...`);
        await mongoose.connect(uri);

        console.log('Clearing existing test data...');
        await User.deleteMany({});
        await Complaint.deleteMany({});

        console.log('Creating demo users...');
        const student = await User.create({
            name: 'Priya Sharma',
            email: 'priya@campus.edu',
            password: 'password123',
            role: 'student',
            rollNumber: 'CS2026-042',
            department: 'Computer Science',
            phone: '9876543210',
        });

        const admin = await User.create({
            name: 'Campus Facility Admin',
            email: 'admin@campus.edu',
            password: 'adminpassword123',
            role: 'admin',
            department: 'Campus Administration',
        });

        console.log('Creating demo complaints...');
        await Complaint.create([
            {
                title: 'Library AC not cooling on 2nd Floor',
                category: 'Electrical',
                description: 'The main air conditioner unit in the reference section is making a buzzing sound and not cooling.',
                status: 'In Progress',
                student: student._id,
                studentName: student.name,
                studentEmail: student.email,
                adminRemarks: 'Maintenance team dispatched to inspect condenser coils.',
                statusHistory: [
                    { status: 'Pending', changedBy: student.name, remark: 'Complaint submitted' },
                    { status: 'In Progress', changedBy: admin.name, remark: 'Maintenance team dispatched' }
                ]
            },
            {
                title: 'Hostel Block B Wi-Fi dropouts',
                category: 'Internet',
                description: 'The 5GHz Wi-Fi access point in 3rd-floor hallway keeps disconnecting every few minutes.',
                status: 'Pending',
                student: student._id,
                studentName: student.name,
                studentEmail: student.email,
                statusHistory: [
                    { status: 'Pending', changedBy: student.name, remark: 'Complaint submitted' }
                ]
            },
            {
                title: 'Water cooler leaking in Academic Block 1',
                category: 'Infrastructure',
                description: 'Tap on the 1st floor water dispenser is loose and leaking onto the floor.',
                status: 'Resolved',
                student: student._id,
                studentName: student.name,
                studentEmail: student.email,
                adminRemarks: 'Valve replaced. Leak repaired.',
                statusHistory: [
                    { status: 'Pending', changedBy: student.name, remark: 'Complaint submitted' },
                    { status: 'In Progress', changedBy: admin.name, remark: 'Plumber assigned' },
                    { status: 'Resolved', changedBy: admin.name, remark: 'Valve replaced. Leak repaired.' }
                ]
            }
        ]);

        console.log('\n======================================================');
        console.log(' Demo Data Seeded Successfully!');
        console.log(' Student Account: priya@campus.edu / password123');
        console.log(' Admin Account:   admin@campus.edu / adminpassword123');
        console.log('======================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
};

seedData();
