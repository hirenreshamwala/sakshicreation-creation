import type { NextApiRequest, NextApiResponse } from 'next';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  mobileCode: string;
  whatsapp: string;
  whatsappCode: string;
  address: string;
  aadhar: string;
  joining: string;
  birth: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// In-memory store for demo
const staffList: Staff[] = [
  {
    _id: 'demo1',
    firstName: 'Sagar',
    lastName: 'Shah',
    email: 'sagarshah123@gmail.com',
    mobile: '98312-13221',
    mobileCode: '91',
    whatsapp: '98312-13221',
    whatsappCode: '91',
    address: '78 , Akshya Nagar-2 , 1st Block , Rammurthy nagar, Bangalore-560016',
    aadhar: '27ASD564S8D7564SAD8',
    joining: '2025-02-10',
    birth: '2025-02-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __v: 0,
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const data = req.body;
    const now = new Date().toISOString();
    const newStaff: Staff = {
      _id: Math.random().toString(36).substr(2, 24),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobile: data.mobile,
      mobileCode: data.mobileCode,
      whatsapp: data.whatsapp,
      whatsappCode: data.whatsappCode,
      address: data.address,
      aadhar: data.aadhar,
      joining: data.joining,
      birth: data.birth,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    };
    staffList.push(newStaff);
    return res.status(201).json(newStaff);
  }
  if (req.method === 'GET') {
    return res.status(200).json({ data: staffList });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 