import { useState, useEffect } from 'react';
import { fetchUsers, fetchProducts, fetchProductDetail } from '../utils/api';

// 倒计时Hook
export const useCountdown = (initialHours = 2, initialMinutes = 10, initialSeconds = 23) => {
  const [countdown, setCountdown] = useState({ 
    hours: initialHours, 
    minutes: initialMinutes, 
    seconds: initialSeconds 
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return countdown;
};

// 用户管理Hook
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({ 
    id: 1, name: '张三', role: 'operator', avatar: '👨‍💼', color: '#3b82f6' 
  });

  useEffect(() => {
    fetchUsers()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          setCurrentUser(data[0]);
        }
      })
      .catch(console.error);
  }, []);

  return { users, currentUser, setCurrentUser };
};

// 产品管理Hook - 修复 currentUser 为 null 的情况
export const useProducts = (currentUser, filterOwner, filterStatus) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = () => {
    // 如果 currentUser 为 null，不加载产品
    if (!currentUser) {
      setProducts([]);
      return;
    }
    
    setLoading(true);
    const params = {};
    
    // 安全检查 currentUser.role
    if (filterOwner === 'mine' && currentUser.role !== 'admin') {
      params.owner_id = currentUser.id;
    }
    if (filterStatus !== 'all') {
      params.status = filterStatus;
    }

    fetchProducts(params)
      .then(data => { 
        if (Array.isArray(data)) setProducts(data); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    loadProducts(); 
  }, [filterOwner, filterStatus, currentUser?.id]); // 使用 currentUser?.id 避免依赖整个对象

  return { products, loading, loadProducts };
};

// 产品详情Hook
export const useProductDetail = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);

  const loadProductDetail = (id) => {
    fetchProductDetail(id)
      .then(data => {
        setSelectedProduct(data);
        setSelectedDayNumber(data.current_day || 1);
      })
      .catch(console.error);
  };

  return { 
    selectedProduct, 
    setSelectedProduct, 
    selectedDayNumber, 
    setSelectedDayNumber, 
    loadProductDetail 
  };
};
