const defaultTasks = [
  {id:1,subject:"Database Management Systems",name:"DBMS Assignment",date:"2026-09-30",hours:3,priority:"high",done:false,reminder:"due"},
  {id:2,subject:"Java Programming",name:"Java Practical",date:"2026-10-01",hours:2,priority:"high",done:false,reminder:"due"},
  {id:3,subject:"Mathematics",name:"Maths Homework",date:"2026-10-03",hours:2,priority:"medium",done:false,reminder:"1day"},
  {id:4,subject:"Computer Networks",name:"CN Reading",date:"2026-10-08",hours:2,priority:"low",done:false,reminder:"2days"},
  {id:5,subject:"C Programming",name:"C Programming Assignment",date:"2026-09-28",hours:2,priority:"low",done:true,reminder:"none"}
];

const stored = localStorage.getItem("technova_tasks");
const tasks = stored ? JSON.parse(stored) : defaultTasks;
const today = new Date(); today.setHours(0,0,0,0);
const priorityScore = {high:3,medium:2,low:1};
const $ = id => document.getElementById(id);

function saveTasks(){ localStorage.setItem("technova_tasks", JSON.stringify(tasks)); }
function dateObj(s){ const d=new Date(s+"T00:00:00"); return d; }
function isOverdue(t){ return !t.done && dateObj(t.date) < today; }
function isToday(t){ return !t.done && dateObj(t.date).getTime()===today.getTime(); }
function labelDate(t){ return new Date(t.date+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); }
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
function reminderText(t){ return ({none:"No reminder",due:"Due date · 9:00 AM",1day:"1 day before · 9:00 AM",2days:"2 days before · 9:00 AM"}[t.reminder||"none"]); }

function taskHTML(t){
  const over=isOverdue(t);
  return `<div class="task">
    <button class="check" onclick="toggleTask(${t.id})">${t.done?"✓":""}</button>
    <div class="task-info">
      <div class="task-title">${escapeHTML(t.name)}</div>
      <div class="meta">${escapeHTML(t.subject)} &nbsp; • &nbsp; ${t.done?"Completed":"Task"}</div>
      <div class="deadline ${over?"over":""}">▣ Deadline: ${labelDate(t)} ${over?"(Overdue)":""} &nbsp; ◷ ${t.hours} h</div>
      ${!t.done && t.reminder && t.reminder!=="none"?`<div class="reminder-label">🔔 ${reminderText(t)}</div>`:""}
    </div>
    <span class="badge ${t.priority}">${t.priority.toUpperCase()}</span>
    <span class="menu">⋮</span>
  </div>`;
}

function render(){
  const pending=tasks.filter(t=>!t.done);
  const overdue=pending.filter(isOverdue);
  const upcoming=pending.filter(t=>!isOverdue(t));
  upcoming.sort((a,b)=>(priorityScore[b.priority]-priorityScore[a.priority]) || (Number(isToday(b))-Number(isToday(a))) || (dateObj(a.date)-dateObj(b.date)));
  const next=upcoming.slice(0,1);
  const rest=upcoming.slice(1).sort((a,b)=>(dateObj(a.date)-dateObj(b.date)) || (priorityScore[b.priority]-priorityScore[a.priority]));
  const completed=tasks.filter(t=>t.done);

  $("pendingHours").textContent=pending.reduce((s,t)=>s+Number(t.hours),0)+" h";
  $("pendingCount").textContent=`(${pending.length} tasks)`;
  $("overdueCount").textContent=overdue.length;
  $("todayCount").textContent=pending.filter(isToday).length;
  $("completedCount").textContent=completed.length;
  $("overdueBadge").textContent=overdue.length;
  $("nextBadge").textContent=next.length;
  $("upcomingBadge").textContent=rest.length;
  $("doneBadge").textContent=completed.length;
  $("overdueList").innerHTML=overdue.length?overdue.map(taskHTML).join(""):`<div class="empty">No overdue tasks 🎉</div>`;
  $("nextList").innerHTML=next.length?next.map(taskHTML).join(""):`<div class="empty">No pending tasks</div>`;
  $("upcomingList").innerHTML=rest.length?rest.map(taskHTML).join(""):`<div class="empty">No upcoming tasks</div>`;
  $("completedList").innerHTML=completed.length?completed.map(taskHTML).join(""):`<div class="empty">No completed tasks yet</div>`;
  updateGreeting();
  updateChatWelcome();
}

function updateGreeting(){
  const h=new Date().getHours();
  const text=h<12?"Good Morning":h<18?"Good Afternoon":"Good Evening";
  const heading=document.querySelector(".heading h1"); if(heading) heading.textContent=`${text}, Student!`;
}

function toggleTask(id){
  const t=tasks.find(x=>x.id===id); if(t){t.done=!t.done; saveTasks(); render(); showToast(t.done?"Task completed":"Task moved back to pending",t.name);}
}

$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  const task={id:Date.now(),subject:$("subject").value.trim(),name:$("taskName").value.trim(),date:$("deadline").value,hours:Number($("hours").value),priority:$("priority").value,reminder:$("reminder").value,done:false};
  tasks.push(task); saveTasks(); e.target.reset(); $("priority").value="medium"; $("reminder").value="due"; render();
  showToast("Task added successfully",`${task.name} · ${reminderText(task)}`);
  requestNotificationPermission();
});

$("reminder").value="due";

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  if(btn.dataset.section==="add") $("addCard").scrollIntoView({behavior:"smooth",block:"center"}); else window.scrollTo({top:0,behavior:"smooth"});
}));

function showToast(title,message,type="info"){
  const el=document.createElement("div"); el.className=`toast ${type}`; el.innerHTML=`<div>🔔</div><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(message)}</p></div><button aria-label="Dismiss">×</button>`;
  el.querySelector("button").onclick=()=>el.remove(); $("toastContainer").appendChild(el); setTimeout(()=>el.remove(),7000);
}

function requestNotificationPermission(){
  if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
}
function sendBrowserNotification(title,body){
  if("Notification" in window && Notification.permission==="granted") new Notification(title,{body});
}

function reminderMoment(t){
  if(!t.reminder || t.reminder==="none") return null;
  const d=dateObj(t.date); d.setHours(9,0,0,0);
  if(t.reminder==="1day") d.setDate(d.getDate()-1);
  if(t.reminder==="2days") d.setDate(d.getDate()-2);
  return d;
}
function checkReminders(){
  const now=new Date();
  tasks.filter(t=>!t.done && t.reminder && t.reminder!=="none").forEach(t=>{
    const m=reminderMoment(t); if(!m) return;
    const key=`technova_reminded_${t.id}_${t.reminder}_${t.date}`;
    if(now>=m && now<m.getTime()+24*60*60*1000 && !localStorage.getItem(key)){
      localStorage.setItem(key,"1");
      showToast(`Reminder: ${t.name}`,`Deadline ${labelDate(t)} · ${t.priority.toUpperCase()} priority`,"reminder");
      sendBrowserNotification(`Reminder: ${t.name}`,`Deadline ${labelDate(t)} · ${t.priority.toUpperCase()} priority`);
    }
  });
}

// Chatbot: local task assistant; no API key or internet required.
const chatReplies={
  overdue:()=>{const a=tasks.filter(isOverdue); return a.length?`You have ${a.length} overdue task${a.length>1?"s":""}:\n• ${a.map(t=>t.name).join("\n• ")}`:"Great! You have no overdue tasks.";},
  today:()=>{const a=tasks.filter(isToday); return a.length?`Due today:\n• ${a.map(t=>`${t.name} (${t.priority})`).join("\n• ")}`:"Nothing is due today.";},
  next:()=>{const a=tasks.filter(t=>!t.done&&!isOverdue(t)).sort((x,y)=>(priorityScore[y.priority]-priorityScore[x.priority])||(dateObj(x.date)-dateObj(y.date))); return a.length?`Your next task is “${a[0].name}”.\nPriority: ${a[0].priority.toUpperCase()}\nDeadline: ${labelDate(a[0])}`:"You have no pending tasks.";},
  completed:()=>{const n=tasks.filter(t=>t.done).length; return `You have completed ${n} task${n===1?"":"s"}.`;},
  all:()=>{const p=tasks.filter(t=>!t.done).length; return `You have ${p} pending task${p===1?"":"s"} and ${tasks.filter(t=>t.done).length} completed.`;}
};
function botAnswer(q){
  const x=q.toLowerCase();
  if(x.includes("overdue")||x.includes("late")) return chatReplies.overdue();
  if(x.includes("today")||x.includes("due today")) return chatReplies.today();
  if(x.includes("next")||x.includes("priority")||x.includes("what should i do")) return chatReplies.next();
  if(x.includes("completed")||x.includes("done")) return chatReplies.completed();
  if(x.includes("how many")||x.includes("all tasks")||x.includes("pending")) return chatReplies.all();
  if(x.includes("reminder")) return "Reminders are active for tasks that have a reminder selected. Keep this page open for in-app popups; browser notifications work after you allow notification permission.";
  if(x.includes("hello")||x.includes("hi ")) return "Hi! 👋 Ask me about overdue tasks, today's deadlines, completed work, reminders, or what you should do next.";
  return "I can help with: “What should I do next?”, “Show overdue tasks”, “What is due today?”, “How many pending tasks?”, or “Show completed tasks”.";
}
function addChat(text,type){const d=document.createElement("div"); d.className=`chat-msg ${type}`; d.textContent=text; $("chatMessages").appendChild(d); $("chatMessages").scrollTop=$("chatMessages").scrollHeight;}
function updateChatWelcome(){ /* keep chat state intact */ }
function sendChat(q){if(!q.trim())return; addChat(q,"user"); setTimeout(()=>addChat(botAnswer(q),"bot"),250);}
$("chatToggle").onclick=()=>$("chatbot").classList.toggle("open");
$("chatClose").onclick=()=>$("chatbot").classList.remove("open");
$("chatForm").addEventListener("submit",e=>{e.preventDefault();const q=$("chatInput").value;$("chatInput").value="";sendChat(q);});
document.querySelectorAll(".chat-suggestions button").forEach(b=>b.addEventListener("click",()=>sendChat(b.dataset.chat)));

requestNotificationPermission();
render();
checkReminders();
setInterval(checkReminders,30000);
