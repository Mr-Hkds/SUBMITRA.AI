
export const INDIAN_FIRST_NAMES = [
    // Male
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Rohan", "Krishna", "Ishaan",
    "Shaurat", "Atharv", "Kabir", "Aryan", "Advik", "Vivaan", "Dhruv", "Ayaan", "Ansh", "Laksh",
    "Dev", "Rudra", "Shiv", "Parth", "Viraj", "Aary", "Ayush", "Samarth", "Siddharth", "Kunal",
    // Female
    "Aadya", "Diya", "Saanvi", "Ananya", "Myra", "Kiara", "Pari", "Fatima", "Aisha", "Zara",
    "Riya", "Kavya", "Aditi", "Ira", "Anika", "Prisha", "Amarya", "Ahana", "Navya", "Shanaya",
    "Meera", "Ishita", "Sneha", "Nisha", "Pooja", "Neha", "Kritika", "Anjali", "Tanvi", "Roshni"
];

export const INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Kumar", "Patel", "Reddy", "Mehta", "Joshi",
    "Agarwal", "Trivedi", "Iyer", "Nair", "Khan", "Ahmed", "Ali", "Chopra", "Kapoor", "Saxena",
    "Bhatia", "Jain", "Mishra", "Pandey", "Das", "Roy", "Banerjee", "Chatterjee", "Sinha", "Yadav",
    "Chaudhary", "Desai", "Dutta", "Ghosh", "Rao", "Menon", "Pillai", "Kulkarni", "Patil", "Deshmukh"
];

export const generateIndianNames = (count: number): string[] => {
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
        const first = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
        const last = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)];
        names.push(`${first} ${last}`);
    }
    return names;
};
