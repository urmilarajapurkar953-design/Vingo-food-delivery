import jwt from 'jsonwebtoken';

const genToken = async (userId) => {
try {
    const token = await jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return token;
} catch (error) {
    throw new Error('Error generating token');
}
}

export default genToken;
