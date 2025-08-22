// 全局变量
let currentBMR = 0;
let currentTDEE = 0;
let targetCalories = 0;
let foodRecords = [];
let weightRecords = [];
let foodBank = [];

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadData();
    setDefaultDates();
});

// 初始化应用
function initializeApp() {
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('foodDate').value = today;
    document.getElementById('weightDate').value = today;
    
    // 初始化图表
    initializeCharts();
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // BMR表单提交
    document.getElementById('bmrForm').addEventListener('submit', handleBMRSubmit);
    
    // 目标按钮点击
    document.querySelectorAll('.btn-goal').forEach(btn => {
        btn.addEventListener('click', () => setGoal(btn.dataset.goal));
    });

    // 食物记录表单提交
    document.getElementById('foodForm').addEventListener('submit', handleFoodSubmit);
    
    // 体重记录表单提交
    document.getElementById('weightForm').addEventListener('submit', handleWeightSubmit);
    
    // 营养素计算
    document.getElementById('calculateMacros').addEventListener('click', calculateMacros);
    
    // 食物库表单提交
    document.getElementById('foodBankForm').addEventListener('submit', handleFoodBankSubmit);
    
    // 食物搜索
    document.getElementById('foodSearch').addEventListener('input', filterFoodBank);
    
    // 宏量营养素比例输入验证
    document.querySelectorAll('.macro-input input').forEach(input => {
        input.addEventListener('input', validateMacroRatios);
    });
}

// 设置默认日期
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('foodDate').value = today;
    document.getElementById('weightDate').value = today;
}

// 标签切换
function switchTab(tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有标签按钮的active状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签内容
    document.getElementById(tabName).classList.add('active');
    
    // 激活对应的标签按钮
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 根据标签更新数据
    if (tabName === 'food') {
        updateFoodStats();
        renderTodayFoodList();
    } else if (tabName === 'weight') {
        updateWeightStats();
        renderWeightHistory();
    } else if (tabName === 'foodbank') {
        renderFoodBank();
    }
}

// 处理BMR表单提交
function handleBMRSubmit(e) {
    e.preventDefault();
    
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const height = parseInt(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activity = parseFloat(document.getElementById('activity').value);
    
    // 计算BMR (Mifflin-St Jeor公式)
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // 计算TDEE
    const tdee = bmr * activity;
    
    // 保存到全局变量
    currentBMR = Math.round(bmr);
    currentTDEE = Math.round(tdee);
    
    // 显示结果
    document.getElementById('bmrValue').textContent = currentBMR;
    document.getElementById('tdeeValue').textContent = currentTDEE;
    document.getElementById('bmrResult').classList.remove('hidden');
    
    // 更新营养素计算器的目标热量
    document.getElementById('targetCaloriesInput').value = currentTDEE;
    
    // 保存数据
    saveData();
}

// 设置目标
function setGoal(goal) {
    // 移除所有目标按钮的active状态
    document.querySelectorAll('.btn-goal').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 激活选中的目标按钮
    document.querySelector(`[data-goal="${goal}"]`).classList.add('active');
    
    // 计算目标热量
    if (goal === 'lose') {
        targetCalories = currentTDEE - 500;
    } else if (goal === 'maintain') {
        targetCalories = currentTDEE;
    } else if (goal === 'gain') {
        targetCalories = currentTDEE + 300;
    }
    
    // 显示目标热量
    document.getElementById('targetCalories').textContent = targetCalories;
    document.getElementById('goalCalories').classList.remove('hidden');
    
    // 更新营养素计算器的目标热量
    document.getElementById('targetCaloriesInput').value = targetCalories;
    
    // 保存数据
    saveData();
}

// 处理食物记录表单提交
function handleFoodSubmit(e) {
    e.preventDefault();
    
    const foodName = document.getElementById('foodName').value;
    const foodCalories = parseInt(document.getElementById('foodCalories').value);
    const foodDate = document.getElementById('foodDate').value;
    const foodMeal = document.getElementById('foodMeal').value;
    
    // 创建食物记录
    const foodRecord = {
        id: Date.now(),
        name: foodName,
        calories: foodCalories,
        date: foodDate,
        meal: foodMeal,
        timestamp: new Date().toISOString()
    };
    
    // 添加到食物记录数组
    foodRecords.push(foodRecord);
    
    // 清空表单
    e.target.reset();
    setDefaultDates();
    
    // 更新显示
    updateFoodStats();
    renderTodayFoodList();
    
    // 保存数据
    saveData();
}

// 处理体重记录表单提交
function handleWeightSubmit(e) {
    e.preventDefault();
    
    const weightValue = parseFloat(document.getElementById('weightValue').value);
    const weightDate = document.getElementById('weightDate').value;
    
    // 创建体重记录
    const weightRecord = {
        id: Date.now(),
        weight: weightValue,
        date: weightDate,
        timestamp: new Date().toISOString()
    };
    
    // 添加到体重记录数组
    weightRecords.push(weightRecord);
    
    // 清空表单
    e.target.reset();
    setDefaultDates();
    
    // 更新显示
    updateWeightStats();
    renderWeightHistory();
    
    // 保存数据
    saveData();
}

// 处理食物库表单提交
function handleFoodBankSubmit(e) {
    e.preventDefault();
    
    const foodName = document.getElementById('bankFoodName').value;
    const foodCalories = parseInt(document.getElementById('bankFoodCalories').value);
    const protein = parseFloat(document.getElementById('bankProtein').value) || 0;
    const carbs = parseFloat(document.getElementById('bankCarbs').value) || 0;
    const fat = parseFloat(document.getElementById('bankFat').value) || 0;
    
    // 创建食物库项目
    const foodBankItem = {
        id: Date.now(),
        name: foodName,
        calories: foodCalories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        timestamp: new Date().toISOString()
    };
    
    // 添加到食物库
    foodBank.push(foodBankItem);
    
    // 清空表单
    e.target.reset();
    
    // 更新显示
    renderFoodBank();
    
    // 保存数据
    saveData();
}

// 计算营养素需求
function calculateMacros() {
    const targetCalories = parseInt(document.getElementById('targetCaloriesInput').value);
    const proteinRatio = parseInt(document.getElementById('proteinRatio').value);
    const carbRatio = parseInt(document.getElementById('carbRatio').value);
    const fatRatio = parseInt(document.getElementById('fatRatio').value);
    
    if (!targetCalories) {
        alert('请输入目标热量');
        return;
    }
    
    // 计算各营养素的热量
    const proteinCalories = (targetCalories * proteinRatio) / 100;
    const carbCalories = (targetCalories * carbRatio) / 100;
    const fatCalories = (targetCalories * fatRatio) / 100;
    
    // 转换为克数 (蛋白质和碳水化合物4卡/克，脂肪9卡/克)
    const proteinGrams = proteinCalories / 4;
    const carbGrams = carbCalories / 4;
    const fatGrams = fatCalories / 9;
    
    // 显示结果
    document.getElementById('proteinGrams').textContent = Math.round(proteinGrams) + ' g';
    document.getElementById('proteinCalories').textContent = Math.round(proteinCalories) + ' 卡路里';
    
    document.getElementById('carbGrams').textContent = Math.round(carbGrams) + ' g';
    document.getElementById('carbCalories').textContent = Math.round(carbCalories) + ' 卡路里';
    
    document.getElementById('fatGrams').textContent = Math.round(fatGrams) + ' g';
    document.getElementById('fatCalories').textContent = Math.round(fatCalories) + ' 卡路里';
    
    // 显示结果区域
    document.getElementById('macroResults').classList.remove('hidden');
}

// 验证宏量营养素比例
function validateMacroRatios() {
    const proteinRatio = parseInt(document.getElementById('proteinRatio').value) || 0;
    const carbRatio = parseInt(document.getElementById('carbRatio').value) || 0;
    const fatRatio = parseInt(document.getElementById('fatRatio').value) || 0;
    
    const total = proteinRatio + carbRatio + fatRatio;
    
    if (total !== 100) {
        document.getElementById('calculateMacros').disabled = true;
        document.getElementById('calculateMacros').textContent = `比例总和: ${total}% (需要100%)`;
    } else {
        document.getElementById('calculateMacros').disabled = false;
        document.getElementById('calculateMacros').textContent = '计算营养素需求';
    }
}

// 更新食物统计
function updateFoodStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayFoods = foodRecords.filter(food => food.date === today);
    const todayCalories = todayFoods.reduce((sum, food) => sum + food.calories, 0);
    
    // 计算本周平均
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekFoods = foodRecords.filter(food => new Date(food.date) >= weekAgo);
    const weekAvgCalories = weekFoods.length > 0 ? 
        Math.round(weekFoods.reduce((sum, food) => sum + food.calories, 0) / 7) : 0;
    
    // 计算目标达成率
    const goalProgress = targetCalories > 0 ? Math.round((todayCalories / targetCalories) * 100) : 0;
    
    // 更新显示
    document.getElementById('todayCalories').textContent = todayCalories + ' 卡路里';
    document.getElementById('weekAvgCalories').textContent = weekAvgCalories + ' 卡路里';
    document.getElementById('goalProgress').textContent = goalProgress + '%';
    
    // 更新图表
    updateCaloriesChart();
}

// 更新体重统计
function updateWeightStats() {
    if (weightRecords.length === 0) return;
    
    // 按日期排序
    weightRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const currentWeight = weightRecords[weightRecords.length - 1].weight;
    const firstWeight = weightRecords[0].weight;
    const weightChange = currentWeight - firstWeight;
    
    // 设置目标体重 (假设目标体重为当前体重的95%，用于减脂)
    const targetWeight = Math.round(currentWeight * 0.95 * 10) / 10;
    
    // 更新显示
    document.getElementById('currentWeight').textContent = currentWeight + ' kg';
    document.getElementById('weightChange').textContent = (weightChange > 0 ? '+' : '') + weightChange.toFixed(1) + ' kg';
    document.getElementById('targetWeight').textContent = targetWeight + ' kg';
    
    // 更新图表
    updateWeightChart();
}

// 渲染今日食物列表
function renderTodayFoodList() {
    const today = new Date().toISOString().split('T')[0];
    const todayFoods = foodRecords.filter(food => food.date === today);
    
    const container = document.getElementById('todayFoodList');
    container.innerHTML = '';
    
    if (todayFoods.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">今天还没有记录食物</p>';
        return;
    }
    
    todayFoods.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        foodItem.innerHTML = `
            <div class="food-info">
                <strong>${food.name}</strong> - ${food.calories} 卡路里 (${getMealName(food.meal)})
            </div>
            <div class="food-actions">
                <button class="btn-delete" onclick="deleteFood(${food.id})">删除</button>
            </div>
        `;
        container.appendChild(foodItem);
    });
}

// 渲染体重历史
function renderWeightHistory() {
    const container = document.getElementById('weightHistory');
    container.innerHTML = '';
    
    if (weightRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">还没有体重记录</p>';
        return;
    }
    
    // 按日期排序
    const sortedRecords = [...weightRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedRecords.forEach(record => {
        const weightItem = document.createElement('div');
        weightItem.className = 'weight-item';
        weightItem.innerHTML = `
            <div class="weight-info">
                <strong>${record.weight} kg</strong> - ${record.date}
            </div>
            <div class="weight-actions">
                <button class="btn-delete" onclick="deleteWeight(${record.id})">删除</button>
            </div>
        `;
        container.appendChild(weightItem);
    });
}

// 渲染食物库
function renderFoodBank() {
    const container = document.getElementById('foodBankList');
    container.innerHTML = '';
    
    if (foodBank.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">食物库为空，添加一些常用食物吧！</p>';
        return;
    }
    
    foodBank.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-bank-item';
        foodItem.innerHTML = `
            <h4>${food.name}</h4>
            <div class="nutrients">
                <div class="nutrient-item">
                    <div class="value">${food.calories}</div>
                    <div class="label">卡路里/100g</div>
                </div>
                <div class="nutrient-item">
                    <div class="value">${food.protein}</div>
                    <div class="label">蛋白质(g)</div>
                </div>
                <div class="nutrient-item">
                    <div class="value">${food.carbs}</div>
                    <div class="label">碳水(g)</div>
                </div>
                <div class="nutrient-item">
                    <div class="value">${food.fat}</div>
                    <div class="label">脂肪(g)</div>
                </div>
            </div>
            <div class="actions">
                <button class="btn-use" onclick="useFoodFromBank('${food.name}', ${food.calories})">使用</button>
                <button class="btn-delete" onclick="deleteFoodFromBank(${food.id})">删除</button>
            </div>
        `;
        container.appendChild(foodItem);
    });
}

// 过滤食物库
function filterFoodBank() {
    const searchTerm = document.getElementById('foodSearch').value.toLowerCase();
    const foodItems = document.querySelectorAll('.food-bank-item');
    
    foodItems.forEach(item => {
        const foodName = item.querySelector('h4').textContent.toLowerCase();
        if (foodName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 使用食物库中的食物
function useFoodFromBank(foodName, calories) {
    // 切换到食物记录标签
    switchTab('food');
    
    // 填充表单
    document.getElementById('foodName').value = foodName;
    document.getElementById('foodCalories').value = calories;
    
    // 聚焦到食物名称输入框
    document.getElementById('foodName').focus();
}

// 删除食物记录
function deleteFood(id) {
    foodRecords = foodRecords.filter(food => food.id !== id);
    updateFoodStats();
    renderTodayFoodList();
    saveData();
}

// 删除体重记录
function deleteWeight(id) {
    weightRecords = weightRecords.filter(weight => weight.id !== id);
    updateWeightStats();
    renderWeightHistory();
    saveData();
}

// 删除食物库项目
function deleteFoodFromBank(id) {
    foodBank = foodBank.filter(food => food.id !== id);
    renderFoodBank();
    saveData();
}

// 获取餐次名称
function getMealName(meal) {
    const mealNames = {
        'breakfast': '早餐',
        'lunch': '午餐',
        'dinner': '晚餐',
        'snack': '加餐'
    };
    return mealNames[meal] || meal;
}

// 初始化图表
function initializeCharts() {
    // 热量摄入图表
    const caloriesCtx = document.getElementById('caloriesChart').getContext('2d');
    window.caloriesChart = new Chart(caloriesCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '每日热量摄入',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '卡路里'
                    }
                }
            }
        }
    });
    
    // 体重变化图表
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    window.weightChart = new Chart(weightCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '体重变化',
                data: [],
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: '体重 (kg)'
                    }
                }
            }
        }
    });
}

// 更新热量图表
function updateCaloriesChart() {
    if (!window.caloriesChart) return;
    
    // 获取最近7天的数据
    const last7Days = [];
    const last7DaysData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        
        const dayFoods = foodRecords.filter(food => food.date === dateStr);
        const dayCalories = dayFoods.reduce((sum, food) => sum + food.calories, 0);
        last7DaysData.push(dayCalories);
    }
    
    // 更新图表数据
    window.caloriesChart.data.labels = last7Days.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    window.caloriesChart.data.datasets[0].data = last7DaysData;
    window.caloriesChart.update();
}

// 更新体重图表
function updateWeightChart() {
    if (!window.weightChart || weightRecords.length === 0) return;
    
    // 按日期排序
    const sortedRecords = [...weightRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 获取最近10条记录
    const recentRecords = sortedRecords.slice(-10);
    
    // 更新图表数据
    window.weightChart.data.labels = recentRecords.map(record => {
        const d = new Date(record.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    window.weightChart.data.datasets[0].data = recentRecords.map(record => record.weight);
    window.weightChart.update();
}

// 保存数据到本地存储
function saveData() {
    const data = {
        currentBMR,
        currentTDEE,
        targetCalories,
        foodRecords,
        weightRecords,
        foodBank
    };
    localStorage.setItem('fitnessTrackerData', JSON.stringify(data));
}

// 从本地存储加载数据
function loadData() {
    const savedData = localStorage.getItem('fitnessTrackerData');
    if (savedData) {
        const data = JSON.parse(savedData);
        currentBMR = data.currentBMR || 0;
        currentTDEE = data.currentTDEE || 0;
        targetCalories = data.targetCalories || 0;
        foodRecords = data.foodRecords || [];
        weightRecords = data.weightRecords || [];
        foodBank = data.foodBank || [];
        
        // 如果有BMR数据，显示结果
        if (currentBMR > 0) {
            document.getElementById('bmrValue').textContent = currentBMR;
            document.getElementById('tdeeValue').textContent = currentTDEE;
            document.getElementById('bmrResult').classList.remove('hidden');
            document.getElementById('targetCaloriesInput').value = currentTDEE;
        }
        
        // 如果有目标热量，显示目标达成
        if (targetCalories > 0) {
            document.getElementById('targetCalories').textContent = targetCalories;
            document.getElementById('goalCalories').classList.remove('hidden');
            
            // 激活对应的目标按钮
            if (targetCalories === currentTDEE) {
                document.querySelector('[data-goal="maintain"]').classList.add('active');
            } else if (targetCalories < currentTDEE) {
                document.querySelector('[data-goal="lose"]').classList.add('active');
            } else {
                document.querySelector('[data-goal="gain"]').classList.add('active');
            }
        }
        
        // 更新营养素计算器的目标热量
        document.getElementById('targetCaloriesInput').value = targetCalories || currentTDEE;
    }
    
    // 添加一些示例数据（如果食物库为空）
    if (foodBank.length === 0) {
        foodBank = [
            {
                id: 1,
                name: '鸡胸肉',
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6,
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                name: '燕麦',
                calories: 389,
                protein: 16.9,
                carbs: 66.3,
                fat: 6.9,
                timestamp: new Date().toISOString()
            },
            {
                id: 3,
                name: '鸡蛋',
                calories: 155,
                protein: 12.6,
                carbs: 1.1,
                fat: 11.3,
                timestamp: new Date().toISOString()
            }
        ];
        saveData();
    }
}

