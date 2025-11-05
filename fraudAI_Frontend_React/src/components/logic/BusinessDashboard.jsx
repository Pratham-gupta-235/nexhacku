import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import Header from "./Header.jsx";
import SidebarContent from "./SidebarContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, CreditCard, Activity, TrendingUp, Users, ShoppingBag, BarChart3 } from 'lucide-react';
import { motion } from "framer-motion";
import { Line, LineChart, Bar, BarChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const BusinessDashboard = () => {
  const navigate = useNavigate();
  // Demo mode can be enabled via URL (?demo=1), hash (#demo), or localStorage('intellisecure_demo'==='1')
  const initialDemo = (
    new URLSearchParams(window.location.search).get("demo") === "1" ||
    window.location.hash.toLowerCase().includes("demo") ||
    (typeof window !== 'undefined' && localStorage.getItem('intellisecure_demo') === '1')
  );
  const [demoMode, setDemoMode] = useState(initialDemo);
  const [user, setUser] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setBusinessData(null);
      setTransactions([]);
      setRevenue(0);
      setTotalCustomers(0);
      setRevenueData([]);
      setProductData([]);
      navigate("/");
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  // Helper to inject demo data
  const injectDemoData = () => {
    const demoUser = {
      uid: "demo-user-1",
      displayName: "IntelliSecure Biz",
      photoURL: "",
      email: "demo@intellisecure.ai",
    };
    const demoBiz = {
      businessName: "IntelliSecure Cafe",
      upiId: "intellisecurebiz@yesbank",
      accountType: "business",
    };
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const senders = [
      "alice@okaxis",
      "bob@okhdfc",
      "chris@ybl",
      "diana@oksbi",
      "eric@okicici",
    ];
    const remarksList = ["groceries", "rent", "utilities", "entertainment", "other"];
    const amounts = [499, 1299, 259, 899, 159, 2199, 349, 799];
    const offsets = [1, 3, 7, 15, 30, 45, 60, 90];
    const demoTx = offsets.map((d, i) => ({
      id: `demo-${i}`,
      amount: amounts[i % amounts.length],
      recipientUPI: demoBiz.upiId,
      senderUPI: senders[i % senders.length],
      remarks: remarksList[i % remarksList.length],
      status: "Completed",
      createdAt: { seconds: Math.floor((now - d * day) / 1000) },
    }));

    setUser(demoUser);
    setBusinessData(demoBiz);
    setTransactions(demoTx);
    setLoading(false);
  };

  useEffect(() => {
    // Demo: inject hardcoded data and skip Firestore entirely
    if (demoMode) {
      injectDemoData();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if user is a business account
            if (userData.accountType !== 'business') {
              // Redirect to regular dashboard if not business
              navigate("/dashboard");
              return;
            }
            
            setBusinessData(userData);
            // Realtime subscription will handle updates
            subscribeToBusinessTransactions(userData.upiId);
          }
        } catch (error) {
          console.error("Error fetching business data:", error);
        }
      } else {
        setUser(null);
        setBusinessData(null);
        setTransactions([]);
        setRevenue(0);
        setTotalCustomers(0);
        setRevenueData([]);
        setProductData([]);
        navigate("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, demoMode]);

  const enableDemo = () => {
    try {
      localStorage.setItem('intellisecure_demo', '1');
    } catch (_) {}
    const url = new URL(window.location.href);
    url.searchParams.set('demo', '1');
    window.history.replaceState({}, '', url.toString());
    setDemoMode(true);
  };

  // Realtime subscription: listen to common recipient field variants and merge
  const subscribeToBusinessTransactions = (businessUpiId) => {
    if (!businessUpiId) return () => {};

    const txRef = collection(db, "transactions");
    const q1 = query(txRef, where("recipientUPI", "==", businessUpiId));
    const q2 = query(txRef, where("recipientUpiId", "==", businessUpiId));

    const txMap = new Map();

    const applySnapshot = (snap) => {
      snap.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'removed') {
          txMap.delete(change.doc.id);
        } else {
          txMap.set(change.doc.id, data);
        }
      });
      const merged = Array.from(txMap.values());
      // Sort descending by createdAt if available
      merged.sort((a, b) => {
        const at = a?.createdAt?.seconds || 0;
        const bt = b?.createdAt?.seconds || 0;
        return bt - at;
      });
      setTransactions(merged);
      // Update unique customers quickly
      const customers = new Set(merged.map((t) => t.senderUPI).filter(Boolean));
      setTotalCustomers(customers.size);
    };

    const unsubs = [onSnapshot(q1, applySnapshot), onSnapshot(q2, applySnapshot)];
    return () => unsubs.forEach((u) => u && u());
  };

  const processBusinessData = (transactions) => {
    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    setRevenue(totalRevenue);

    // Group transactions by month for revenue chart
    const monthlyRevenue = {};
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(transaction => {
      if (transaction.createdAt && transaction.createdAt.seconds) {
        const date = new Date(transaction.createdAt.seconds * 1000);
        if (date.getFullYear() === currentYear) {
          const monthName = date.toLocaleString('default', { month: 'short' });
          if (!monthlyRevenue[monthName]) {
            monthlyRevenue[monthName] = 0;
          }
          monthlyRevenue[monthName] += transaction.amount || 0;
        }
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map(month => ({
      name: month,
      revenue: monthlyRevenue[month] || 0
    })).filter(item => item.revenue > 0 || months.indexOf(item.name) <= new Date().getMonth());

    setRevenueData(chartData.length > 0 ? chartData : [{ name: 'No data', revenue: 0 }]);

    // Group by product/service (remarks)
    const productRevenue = {};
    transactions.forEach(transaction => {
      const product = transaction.remarks || 'Other';
      if (!productRevenue[product]) {
        productRevenue[product] = 0;
      }
      productRevenue[product] += transaction.amount || 0;
    });

    const productArray = Object.entries(productRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setProductData(productArray.length > 0 ? productArray : [{ name: 'No sales', value: 1 }]);
  };

  // Recompute KPIs and charts whenever transactions change
  useEffect(() => {
    processBusinessData(transactions);
  }, [transactions]);

  const RevenueChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={revenueData}>
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
                  <p className="text-green-400">{`₹${payload[0].value}`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#10b981"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const ProductPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={productData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {productData.map((entry, index) => (
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
      </PieChart>
    </ResponsiveContainer>
  );

  const avgTransactionValue = transactions.length > 0 ? (revenue / transactions.length) : 0;

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="hidden md:flex flex-col w-72 min-h-screen border-r border-gray-800 bg-gray-900">
        <SidebarContent />
      </aside>
      <div className="flex-1 p-6 overflow-y-auto">
        <Header user={user} />
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading business dashboard...</div>
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
                <Avatar className="h-12 w-12 ring-2 ring-green-500">
                  <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                  <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-green-400">{businessData?.businessName || user?.displayName}</h2>
                  <p className="text-sm text-gray-400">Business Account • UPI ID: {businessData?.upiId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!demoMode && (
                  <Button
                    onClick={enableDemo}
                    variant="secondary"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    Enable Demo
                  </Button>
                )}
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors duration-200"
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>

            {/* {demoMode && (
              <div className="mb-4 p-3 rounded-md border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm">
                Demo Mode is active. Showing mock transactions and KPIs for IntelliSecure Cafe.
              </div>
            )} */}

            {/* Business Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Total Revenue", icon: DollarSign, value: revenue.toFixed(2), color: "green", prefix: "₹" },
                { title: "Total Customers", icon: Users, value: totalCustomers, color: "blue", prefix: "" },
                { title: "Total Transactions", icon: Activity, value: transactions.length, color: "purple", prefix: "" },
                { title: "Avg Transaction", icon: TrendingUp, value: avgTransactionValue.toFixed(2), color: "yellow", prefix: "₹" }
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
                        {item.prefix}{item.value}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-green-400 flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueChart />
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-blue-400 flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Top Products/Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductPieChart />
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <div className="mt-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        <div>
                          <p className="font-medium text-white">From: {transaction.senderUPI}</p>
                          <p className="text-sm text-gray-400">
                            {transaction.createdAt?.seconds 
                              ? new Date(transaction.createdAt.seconds * 1000).toLocaleString()
                              : 'Date unknown'}
                          </p>
                          {transaction.remarks && (
                            <p className="text-xs text-gray-500 mt-1">{transaction.remarks}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">+₹{transaction.amount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No transactions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
