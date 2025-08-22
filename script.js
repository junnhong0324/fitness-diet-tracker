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
    updateDashboard();
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
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', () => setGoal(btn.dataset.goal));
    });

    // 食物记录表单提交
    document.getElementById('foodForm').addEventListener('submit', handleFoodSubmit);
    
    // 体重记录表单提交
    document.getElementById('weightForm').addEventListener('submit', handleWeightSubmit);
    
    // 营养素计算
    document.getElementById('calculateMacros').addEventListener('click', calculateMacros);
    
    // 宏量营养素比例输入验证
    document.querySelectorAll('.ratio-input input').forEach(input => {
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
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'food') {
        updateFoodStats();
        renderTodayFoodList();
        renderQuickFoodBank();
    } else if (tabName === 'weight') {
        updateWeightStats();
        renderWeightHistory();
    }
}

// 更新概览页面
function updateDashboard() {
    updateTodayOverview();
    renderRecentRecords();
}

// 更新今日概览
function updateTodayOverview() {
    const today = new Date().toISOString().split('T')[0];
    const todayFoods = foodRecords.filter(food => food.date === today);
    const todayConsumed = todayFoods.reduce((sum, food) => sum + food.calories, 0);
    const todayTarget = targetCalories || currentTDEE;
    const todayRemaining = Math.max(0, todayTarget - todayConsumed);
    const progressPercent = todayTarget > 0 ? Math.min(100, (todayConsumed / todayTarget) * 100) : 0;
    
    // 更新显示
    document.getElementById('todayTarget').textContent = todayTarget + ' 卡';
    document.getElementById('todayConsumed').textContent = todayConsumed + ' 卡';
    document.getElementById('todayRemaining').textContent = todayRemaining + ' 卡';
    
    // 更新进度条
    const progressFill = document.getElementById('todayProgress');
    if (progressFill) {
        progressFill.style.width = progressPercent + '%';
    }
}

// 渲染最近记录
function renderRecentRecords() {
    const container = document.getElementById('recentFoodList');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 获取最近5条食物记录
    const recentFoods = [...foodRecords]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (recentFoods.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.9rem;">还没有食物记录</p>';
        return;
    }
    
    recentFoods.forEach(food => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.style.cssText = 'background: #f8f9fa; border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 0.9rem;';
        recordItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span><strong>${food.name}</strong> - ${food.calories} 卡</span>
                <span style="color: #666; font-size: 0.8rem;">${formatDate(food.date)}</span>
            </div>
        `;
        container.appendChild(recordItem);
    });
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
    
    // 更新概览页面
    updateDashboard();
    
    // 保存数据
    saveData();
}

// 设置目标
function setGoal(goal) {
    // 移除所有目标按钮的active状态
    document.querySelectorAll('.goal-btn').forEach(btn => {
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
    
    // 更新概览页面
    updateDashboard();
    
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
    updateDashboard();
    
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
    document.getElementById('proteinGrams').textContent = Math.round(proteinGrams);
    document.getElementById('proteinCalories').textContent = Math.round(proteinCalories) + ' 卡';
    
    document.getElementById('carbGrams').textContent = Math.round(carbGrams);
    document.getElementById('carbCalories').textContent = Math.round(carbCalories) + ' 卡';
    
    document.getElementById('fatGrams').textContent = Math.round(fatGrams);
    document.getElementById('fatCalories').textContent = Math.round(fatCalories) + ' 卡';
    
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
        document.getElementById('calculateMacros').textContent = '计算需求';
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
    document.getElementById('todayCalories').textContent = todayCalories;
    document.getElementById('weekAvgCalories').textContent = weekAvgCalories;
    document.getElementById('goalProgress').textContent = goalProgress + '%';
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
    document.getElementById('currentWeight').textContent = currentWeight;
    document.getElementById('weightChange').textContent = (weightChange > 0 ? '+' : '') + weightChange.toFixed(1);
    document.getElementById('targetWeight').textContent = targetWeight;
}

// 渲染今日食物列表
function renderTodayFoodList() {
    const today = new Date().toISOString().split('T')[0];
    const todayFoods = foodRecords.filter(food => food.date === today);
    
    const container = document.getElementById('todayFoodList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (todayFoods.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.9rem;">今天还没有记录食物</p>';
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
    if (!container) return;
    
    container.innerHTML = '';
    
    if (weightRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.9rem;">还没有体重记录</p>';
        return;
    }
    
    // 按日期排序
    const sortedRecords = [...weightRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedRecords.forEach(record => {
        const weightItem = document.createElement('div');
        weightItem.className = 'weight-item';
        weightItem.innerHTML = `
            <div class="weight-info">
                <strong>${record.weight} kg</strong> - ${formatDate(record.date)}
            </div>
            <div class="weight-actions">
                <button class="btn-delete" onclick="deleteWeight(${record.id})">删除</button>
            </div>
        `;
        container.appendChild(weightItem);
    });
}

// 渲染快捷食物库
function renderQuickFoodBank() {
    const container = document.getElementById('quickFoodBank');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (foodBank.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.9rem;">食物库为空</p>';
        return;
    }
    
    // 显示前6个常用食物
    const quickFoods = foodBank.slice(0, 6);
    
    quickFoods.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'quick-food-item';
        foodItem.onclick = () => useFoodFromBank(food.name, food.calories);
        foodItem.innerHTML = `
            <h4>${food.name}</h4>
            <div class="calories">${food.calories} 卡/100g</div>
        `;
        container.appendChild(foodItem);
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
    updateDashboard();
    saveData();
}

// 删除体重记录
function deleteWeight(id) {
    weightRecords = weightRecords.filter(weight => weight.id !== id);
    updateWeightStats();
    renderWeightHistory();
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

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// 初始化图表
function initializeCharts() {
    // 图表功能暂时简化，专注于核心功能
    console.log('图表初始化完成');
}

// 保存数据到本地存储
function saveData() {
    const data = {
        currentBMR,
        currentTDEE,
        targetCalories,
        foodRecords,
        weightRecords,
        foodBank,
        lastSaved: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('fitnessTrackerData', JSON.stringify(data));
        console.log('数据已保存到本地存储');
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 从本地存储加载数据
function loadData() {
    try {
        const savedData = localStorage.getItem('fitnessTrackerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            currentBMR = data.currentBMR || 0;
            currentTDEE = data.currentTDEE || 0;
            targetCalories = data.targetCalories || 0;
            foodRecords = data.foodRecords || [];
            weightRecords = data.weightRecords || [];
            foodBank = data.foodBank || [];
            
            console.log('从本地存储加载数据成功');
            
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
                },
                {
                    id: 4,
                    name: '牛奶',
                    calories: 42,
                    protein: 3.4,
                    carbs: 5.0,
                    fat: 1.0,
                    timestamp: new Date().toISOString()
                },
                {
                    id: 5,
                    name: '香蕉',
                    calories: 89,
                    protein: 1.1,
                    carbs: 22.8,
                    fat: 0.3,
                    timestamp: new Date().toISOString()
                },
                {
                    id: 6,
                    name: '三文鱼',
                    calories: 208,
                    protein: 25.4,
                    carbs: 0,
                    fat: 12.4,
                    timestamp: new Date().toISOString()
                }
            ];
            saveData();
        }
        
    } catch (error) {
        console.error('加载数据失败:', error);
        // 如果加载失败，使用默认数据
        foodBank = [
            {
                id: 1,
                name: '鸡胸肉',
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6,
                timestamp: new Date().toISOString()
            }
        ];
    }
}

// 定期自动保存数据
setInterval(() => {
    if (foodRecords.length > 0 || weightRecords.length > 0 || currentBMR > 0) {
        saveData();
    }
}, 30000); // 每30秒自动保存一次

// 页面卸载前保存数据
window.addEventListener('beforeunload', () => {
    saveData();
});

// 导出数据功能
function exportData() {
    const data = {
        currentBMR,
        currentTDEE,
        targetCalories,
        foodRecords,
        weightRecords,
        foodBank,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitness-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// 导入数据功能
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (data.foodRecords && data.weightRecords && data.foodBank) {
                currentBMR = data.currentBMR || 0;
                currentTDEE = data.currentTDEE || 0;
                targetCalories = data.targetCalories || 0;
                foodRecords = data.foodRecords;
                weightRecords = data.weightRecords;
                foodBank = data.foodBank;
                
                // 保存数据
                saveData();
                
                // 更新显示
                updateDashboard();
                updateFoodStats();
                renderTodayFoodList();
                renderQuickFoodBank();
                updateWeightStats();
                renderWeightHistory();
                
                alert('数据导入成功！');
            } else {
                alert('数据格式不正确，请选择正确的导出文件。');
            }
        } catch (error) {
            alert('导入失败：' + error.message);
        }
    };
    reader.readAsText(file);
}

