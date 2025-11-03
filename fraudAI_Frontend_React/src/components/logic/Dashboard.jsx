import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "./firebase.js";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Header from "./Header.jsx";
import SidebarContent from "./SidebarContent";
import { handleGoogleSignIn } from "./auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, CreditCard, Activity, Zap } from 'lucide-react';
import { motion } from "framer-motion";
import { Line, LineChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUpiId("");
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUpiId(userData.upiId);
          setBalance(userData.balance || 10000); // Default balance if not set
          
          // Fetch transactions
          await fetchTransactions(userData.upiId);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const fetchTransactions = async (userUpiId) => {
    try {
      const transactionsRef = collection(db, "transactions");
      const q = query(transactionsRef, where("senderUPI", "==", userUpiId));
      const querySnapshot = await getDocs(q);
      
      const fetchedTransactions = [];
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setTransactions(fetchedTransactions);
      processTransactionData(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const processTransactionData = (transactions) => {
    // Calculate total spending
    const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    setTotalSpending(total);

    // Group transactions by month for the line chart
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(transaction => {
      if (transaction.createdAt && transaction.createdAt.seconds) {
        const date = new Date(transaction.createdAt.seconds * 1000);
        if (date.getFullYear() === currentYear) {
          const monthName = date.toLocaleString('default', { month: 'short' });
          if (!monthlyData[monthName]) {
            monthlyData[monthName] = 0;
          }
          monthlyData[monthName] += transaction.amount || 0;
        }
      }
    });

    // Convert to array format for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map(month => ({
      name: month,
      value: monthlyData[month] || 0
    })).filter(item => item.value > 0 || months.indexOf(item.name) <= new Date().getMonth());

    setTransactionData(chartData.length > 0 ? chartData : [{ name: 'No data', value: 0 }]);

    // Group transactions by category/remarks for pie chart
    const categoryData = {};
    transactions.forEach(transaction => {
      const category = transaction.remarks || 'Other';
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += transaction.amount || 0;
    });

    // Convert to array and get top 4 categories
    const categoryArray = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    setSpendingData(categoryArray.length > 0 ? categoryArray : [
      { name: 'No transactions', value: 1 }
    ]);
  };

  const TransactionChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={transactionData}>
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg">
                  <p className="text-blue-400">{`₹${payload[0].value}`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const SpendingPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={spendingData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {spendingData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg">
                  <p className="text-blue-400">{`${payload[0].name}: ₹${payload[0].value}`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend 
          formatter={(value, entry, index) => <span className="text-gray-400">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="hidden md:flex flex-col w-72 min-h-screen border-r border-gray-800 bg-gray-900">
        <SidebarContent />
      </aside>
      <div className="flex-1 p-6 overflow-y-auto">
        <Header user={user} onSignIn={handleGoogleSignIn} />
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading dashboard data...</div>
          </div>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-between items-center mb-6"
            >
          <div className="flex items-center space-x-4 mt-4">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500">
              <AvatarImage src={user?.photoURL} alt={user?.displayName} />
              <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-blue-400">{user?.displayName}</h2>
              <p className="text-sm text-gray-400">UPI ID: {upiId}</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors duration-200"
          >
            Sign Out
          </Button>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Total Balance", icon: DollarSign, value: balance.toFixed(2), color: "blue" },
            { title: "Total Spending", icon: CreditCard, value: totalSpending.toFixed(2), color: "green" },
            { title: "Total Transactions", icon: Activity, value: transactions.length, color: "purple" },
            { title: "Cashback Earned", icon: Zap, value: (totalSpending * 0.02).toFixed(2), color: "yellow" }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{item.title}</CardTitle>
                  <item.icon className={`h-4 w-4 text-${item.color}-400`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-${item.color}-400`}>
                    {item.title === "Total Transactions" ? item.value : `₹${item.value}`}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-400">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionChart />
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-400">Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingPieChart />
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

