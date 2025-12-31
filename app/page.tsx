'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  Home as HomeIcon, CheckSquare, BarChart2, ShoppingBag, Plus, Trash2, Zap, Target, 
  ChevronLeft, ChevronRight, Upload, Lock, User, Calendar as CalIcon, ImageIcon, CheckCircle2, Circle 
} from 'lucide-react'

// ==========================================
// 🎨 MASTER THEME EDITOR (Edit Hex Codes Here)
// ==========================================
const THEME = {
  bg: '#e4e3e1ff',           // Main Background
  sidebarBg: '#3f3e64ff',    // Sidebar Green
  ticketBody: '#a3b9e2ff',   // Profile Ticket Gold
  navSquare: '#944E52',    // 3x2 Grid Icons (Red)
  headerNavy: '#32355aff',   // Container Borders
  cardFill: '#c4c4c4ff',     // Container Interiors
  taskCard: '#E9EBF1',     // Individual Task Items
  shopGreen: '#4c9141ff',    // Success/Purchase Green
  secondary: '#4d9446ff',  // Chart Dots / Progress Bar
  ink: '#2D3436',          // Primary Text
  white: '#FFFFFF',
  dotColor: '#D6D2C4',     // Background Dots
}

// --- HELPER: CHART WRAPPER (Fixes Hydration/Shadow errors) ---
const ChartWrapper = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="h-64 w-full animate-pulse rounded-[40px] opacity-20" style={{ backgroundColor: THEME.white }} />
  return <>{children}</>
}

export default function PlanaOS() {
  const [activeTab, setActiveTab] = useState('Home')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // --- DATABASE STATES ---
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])
  const [habitLogs, setHabitLogs] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [visionBoard, setVisionBoard] = useState<any[]>([])
  const [profile, setProfile] = useState({ username: 'USER', avatar: '' })

  // --- UI STATES ---
  const [journalDate, setJournalDate] = useState(new Date())
  const [chartScale, setChartScale] = useState<'Week' | 'Month' | 'Year' | 'All'>('Week')

useEffect(() => { 
    setMounted(true)

    // 1. Create a function to check the user's status
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // 2. If no account is logged in, send them to /login
        router.push('/login')
      } else {
        // 3. If they are logged in, save the user info and LOAD the data
        setUser(session.user)
        fetchData() 
      }
    }

    checkUser()

    // --- Midnight Auto-Refresh Logic (Keep this exactly as it was) ---
    const now = new Date()
    const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    const msToMidnight = night.getTime() - now.getTime()
    const timer = setTimeout(() => window.location.reload(), msToMidnight)
    
    return () => clearTimeout(timer)
  }, [router]) // Added router here to keep the code stable

  async function fetchData() {
    setLoading(true)
    try {
      const [t, c, h, hl, g, r, j, v] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('habits').select('*'),
        supabase.from('habit_logs').select('*'),
        supabase.from('goals').select('*'),
        supabase.from('rewards').select('*'),
        supabase.from('journal').select('*'),
        supabase.from('vision_board').select('*')
      ])
      setTasks(t.data || []); setCategories(c.data || []); setHabits(h.data || []);
      setHabitLogs(hl.data || []); setGoals(g.data || []); setRewards(r.data || []);
      setJournalEntries(j.data || []); setVisionBoard(v.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (!mounted) return null

  // --- XP MATH ---
  const taskXP = tasks.filter(t => t.is_completed).reduce((acc, t) => acc + (t.xp_value || 0), 0)
  const goalXP = goals.filter(g => g.is_completed).reduce((acc) => acc + 10000, 0)
  const spentXP = rewards.filter(r => r.is_purchased).reduce((acc, r) => acc + (r.cost || 0), 0)
  const totalXP = taskXP + goalXP
  const availableXP = totalXP - spentXP
  const currentLevel = Math.floor(totalXP / 5000) + 1
  const progressPercent = (totalXP % 5000) / 50

  // --- DATE GENERATOR ---
  const formatKey = (d: Date) => d.toISOString().split('T')[0]
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return formatKey(d)
  })

  // --- CHART DATA GENERATOR ---
  const chartData = weekDays.map(date => ({
    name: date.split('-')[2],
    xp: tasks.filter(t => t.is_completed && t.completed_at?.startsWith(date)).reduce((acc, t) => acc + t.xp_value, 0),
    habits: habitLogs.filter(l => l.date === date && l.completed).length
  }))

  // --- IMAGE HANDLER ---
  const handleUpload = async (e: any, type: 'profile' | 'vision') => {
    const file = e.target.files[0]
    if (!file) return
    const name = `${Math.random()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('plana').upload(name, file)
    if (error) return alert(error.message)
    const { data: { publicUrl } } = supabase.storage.from('plana').getPublicUrl(name)
    
    if (type === 'profile') setProfile({ ...profile, avatar: publicUrl })
    else await supabase.from('vision_board').insert([{ image_url: publicUrl }])
    fetchData()
  }

  return (
    <div className="min-h-screen flex transition-all duration-500" 
         style={{ backgroundColor: THEME.bg, color: THEME.ink, backgroundImage: `radial-gradient(${THEME.dotColor} 1.5px, transparent 1.5px)`, backgroundSize: '30px 30px' }}>
      
      {/* --- SIDEBAR --- */}
      <aside className="w-80 p-8 flex flex-col gap-8 sticky top-0 h-screen border-r border-black/5">
        <div className="relative w-full aspect-[2/3] p-4 flex flex-col rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: THEME.sidebarBg }}>
          <div className="absolute top-1/2 -left-5 w-10 h-10 rounded-full" style={{ backgroundColor: THEME.bg }} />
          <div className="absolute top-1/2 -right-5 w-10 h-10 rounded-full" style={{ backgroundColor: THEME.bg }} />
          <div className="flex-1 rounded-xl flex flex-col relative border border-white/10" style={{ backgroundColor: THEME.ticketBody }}>
             <div className="w-full h-4 absolute -top-2 flex justify-around px-2">
                {[...Array(6)].map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full opacity-20" style={{ backgroundColor: THEME.sidebarBg }} />)}
             </div>
             <label className="flex-1 flex flex-col items-center justify-center cursor-pointer group">
                <input type="file" className="hidden" onChange={e => handleUpload(e, 'profile')} />
                {profile.avatar ? <img src={profile.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" /> : <div className="text-8xl group-hover:scale-110 transition-transform">😎</div>}
                <div className="mt-4 bg-black/10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic">Lvl {currentLevel}</div>
             </label>
             <div className="p-5 border-t-2 border-dashed border-black/10 text-center bg-black/5">
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">{profile.username}</p>
                <p className="text-xl font-black tracking-tighter text-white">{availableXP.toLocaleString()} XP</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'Home', icon: <HomeIcon size={20}/> }, { id: 'Tasks', icon: <CheckSquare size={20}/> }, 
            { id: 'Shop', icon: <ShoppingBag size={20}/> }, { id: 'Logs', icon: <BarChart2 size={20}/> },
            { id: 'Profile', icon: <User size={20}/> }, { id: 'Calendar', icon: <CalIcon size={20}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`aspect-square rounded-2xl flex items-center justify-center transition-all border border-black/10 ${activeTab === tab.id ? 'scale-90 brightness-75' : 'hover:scale-110 shadow-md'}`}
              style={{ backgroundColor: THEME.navSquare, color: THEME.white }}>
              {tab.icon}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-16 overflow-y-auto">
        <div className="mb-12">
            <h1 className="text-5xl font-black uppercase tracking-[0.2em]">{new Date().toLocaleString('default', { month: 'long' })}</h1>
            <h2 className="text-6xl font-black italic mt-2 opacity-80">{new Date().getDate()}th</h2>
        </div>

        {/* ==========================================
            🏠 HOME TAB
        ========================================== */}
        {activeTab === 'Home' && (
          <div className="flex flex-col gap-12 animate-in fade-in duration-700">
            <div className="rounded-[50px] border-[6px] p-10 bg-white/40 shadow-xl" style={{ borderColor: THEME.headerNavy }}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-black italic">Habit Tracker</h3>
                    <button onClick={async () => { const n = prompt("New Habit?"); if(n) { await supabase.from('habits').insert([{name: n}]); fetchData() }}}
                            className="p-3 bg-black text-white rounded-full"><Plus/></button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-center">
                     <thead>
                       <tr className="text-xs font-black uppercase opacity-30 border-b border-black/5 tracking-widest">
                         <th className="text-left pb-6">Tasks</th>
                         {weekDays.map(d => <th key={d} className="pb-6">{d.split('-')[2]}</th>)}
                       </tr>
                     </thead>
                     <tbody>
                       {habits.map(h => (
                         <tr key={h.id} className="border-b border-black/5 group">
                            <td className="py-6 font-black text-xl flex items-center gap-4">
                                <button onClick={async () => { await supabase.from('habits').delete().eq('id', h.id); fetchData() }} className="opacity-0 group-hover:opacity-100 text-red-400 transition-opacity"><Trash2 size={18}/></button>
                                {h.name}
                            </td>
                            {weekDays.map(d => {
                                const isDone = habitLogs.find(l => l.habit_id === h.id && l.date === d)?.completed
                                return (
                                  <td key={d}>
                                    <button onClick={async () => {
                                        const ex = habitLogs.find(l => l.habit_id === h.id && l.date === d)
                                        if (ex) await supabase.from('habit_logs').update({ completed: !ex.completed }).eq('id', ex.id)
                                        else await supabase.from('habit_logs').insert([{ habit_id: h.id, date: d, completed: true }])
                                        fetchData()
                                    }} className={`w-10 h-10 rounded-2xl border-[3px] transition-all ${isDone ? 'rotate-12 border-black' : 'border-black/5 bg-white/20'}`} 
                                       style={{ backgroundColor: isDone ? THEME.secondary : '' }} />
                                  </td>
                                )
                            })}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 h-96">
                <div className="rounded-[50px] border-[6px] p-10 bg-white/40 shadow-xl flex flex-col" style={{ borderColor: THEME.headerNavy }}>
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setJournalDate(new Date(journalDate.setDate(journalDate.getDate() - 1)))}><ChevronLeft/></button>
                        <div className="text-center font-black italic">Journal <span className="block text-[10px] opacity-30 not-italic uppercase">{formatKey(journalDate)}</span></div>
                        <button onClick={() => setJournalDate(new Date(journalDate.setDate(journalDate.getDate() + 1)))}><ChevronRight/></button>
                    </div>
                    <textarea value={journalEntries.find(e => e.date === formatKey(journalDate))?.content || ''}
                      placeholder="Write your story..." className="flex-1 bg-transparent outline-none italic leading-relaxed resize-none text-xl"
                      onChange={async (e) => {
                        const content = e.target.value; const date = formatKey(journalDate)
                        const ex = journalEntries.find(ent => ent.date === date)
                        if (!ex) await supabase.from('journal').insert([{date, content, user_id: user.id}])
                        else await supabase.from('journal').update({content}).eq('id', ex.id).eq('user_id', user.id)
                        fetchData()
                      }} />
                </div>
                <div className="rounded-[50px] border-[6px] p-10 bg-white/40 shadow-xl flex flex-col overflow-hidden" style={{ borderColor: THEME.headerNavy }}>
                    <h3 className="text-2xl font-black italic mb-6">Goals</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-4">
                        {goals.map(g => (
                            <div key={g.id} className="flex items-center justify-between bg-white/20 p-4 rounded-3xl group">
                                <button onClick={async () => { await supabase.from('goals').update({ is_completed: !g.is_completed }).eq('id', g.id); fetchData() }}
                                    className={`flex items-center gap-4 text-lg font-black text-left ${g.is_completed ? 'line-through opacity-30 italic' : ''}`}>
                                    {g.is_completed ? <CheckCircle2 className="text-green-500"/> : <Circle className="opacity-20"/>} {g.title}
                                </button>
                                <button onClick={async () => { await supabase.from('goals').delete().eq('id', g.id); fetchData() }} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={18}/></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={async () => { const t = prompt("What's the goal?"); if(t) { await supabase.from('goals').insert([{title: t}]); fetchData() }}}
                            className="mt-6 p-4 border-4 border-dashed border-black/10 rounded-[30px] font-black uppercase text-[10px] opacity-40 hover:opacity-100">+ New Goal</button>
                </div>
            </div>

            <div className="rounded-[50px] border-[6px] p-10 bg-white/40 shadow-xl" style={{ borderColor: THEME.headerNavy }}>
                <div className="flex justify-between items-center mb-8 font-black italic text-3xl">Vision Board
                    <label className="p-3 bg-black text-white rounded-full cursor-pointer"><Upload size={24}/><input type="file" className="hidden" onChange={e => handleUpload(e, 'vision')} /></label>
                </div>
                <div className="grid grid-cols-4 gap-6">
                    {visionBoard.map(v => (
                        <div key={v.id} className="relative aspect-square rounded-[30px] overflow-hidden border-4 border-white shadow-lg group">
                            <img src={v.image_url} className="w-full h-full object-cover" />
                            <button onClick={async () => { await supabase.from('vision_board').delete().eq('id', v.id); fetchData() }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                        </div>
                    ))}
                    {visionBoard.length === 0 && <div className="col-span-4 h-40 flex items-center justify-center opacity-10 font-black italic text-4xl">EMPTY SPACE</div>}
                </div>
            </div>
          </div>
        )}

        {/* ==========================================
            📝 TASKS TAB
        ========================================== */}
        {activeTab === 'Tasks' && (
          <div className="flex flex-col gap-12 animate-in slide-in-from-right duration-700">
             <div className="flex justify-between items-center text-5xl font-black italic">Tasks
                <button onClick={async () => { const n = prompt("New Category?"); if(n) { await supabase.from('categories').insert([{name: n, user_id: user.id}]); fetchData() }}}
                        className="bg-black text-white px-10 py-4 rounded-full text-xs font-black uppercase shadow-xl">New Section</button>
             </div>
             <div className="flex gap-10 overflow-x-auto pb-10 scrollbar-hide">
                {categories.map(cat => (
                    <div key={cat.id} className="min-w-[360px] flex flex-col gap-8">
                        <div className="p-6 rounded-full text-center text-white font-black italic uppercase tracking-widest shadow-xl relative" style={{ backgroundColor: THEME.headerNavy }}>
                            {cat.name}
                            <button onClick={async () => { await supabase.from('categories').delete().eq('id', cat.id); fetchData() }} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100"><Trash2 size={18}/></button>
                        </div>
                        <div className="flex-1 rounded-[60px] border-[6px] p-8 flex flex-col gap-6 bg-white/20 shadow-inner" style={{ borderColor: THEME.headerNavy }}>
                            {tasks.filter(t => t.category === cat.name && !t.is_completed).map(task => (
                                <div key={task.id} className="p-8 rounded-[45px] border-[5px] group relative transition-all hover:translate-y-[-4px] shadow-lg" style={{ backgroundColor: THEME.taskCard, borderColor: THEME.headerNavy }}>
                                    <h4 className="text-2xl font-black text-slate-700 leading-tight mb-4">{task.title}</h4>
                                    <div className="flex justify-between items-center">
                                        <button onClick={async () => { await supabase.from('tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', task.id); fetchData() }}
                                                className="text-xs font-black uppercase text-blue-600 hover:underline tracking-widest italic">Complete →</button>
                                        <button onClick={async () => { await supabase.from('tasks').delete().eq('id', task.id); fetchData() }} className="text-red-300 opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                                    </div>
                                    <div className="absolute -top-4 -right-4 bg-white border-[4px] border-black w-14 h-14 rounded-full flex items-center justify-center text-sm font-black shadow-xl">{task.xp_value}</div>
                                </div>
                            ))}
                            <button onClick={async () => {
                                const t = prompt("Task Name?"); const xp = prompt("XP (100, 200, 500)?")
                                if(t && xp) { await supabase.from('tasks').insert([{title: t, category: cat.name, xp_value: parseInt(xp)}]); fetchData() }
                            }} className="py-8 border-4 border-dashed border-black/10 rounded-[40px] opacity-20 hover:opacity-100 flex items-center justify-center"><Plus size={40}/></button>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* ==========================================
            📊 LOGS TAB
        ========================================== */}
        {activeTab === 'Logs' && (
          <div className="flex flex-col gap-16 animate-in zoom-in-95 duration-700">
             <div className="flex justify-between items-end font-black italic text-4xl">History
                <div className="flex gap-4 p-2 bg-black/5 rounded-full">
                    {['Week', 'Month', 'Year', 'All'].map(s => (
                        <button key={s} onClick={() => setChartScale(s as any)} 
                        className={`px-8 py-2 rounded-full font-black uppercase text-[10px] tracking-widest ${chartScale === s ? 'bg-black text-white shadow-lg' : 'opacity-30'}`}>{s}</button>
                    ))}
                </div>
             </div>
             <ChartWrapper>
                <div className="grid grid-cols-2 gap-12">
                    <div className="h-96 rounded-[50px] border-[6px] p-10 bg-white/40 shadow-xl" style={{ borderColor: THEME.headerNavy }}>
                        <h4 className="text-center font-black text-[10px] uppercase opacity-30 tracking-[0.4em] mb-10">XP Velocity</h4>
                        <ResponsiveContainer width="100%" height="80%">
                            <LineChart data={chartData}><Tooltip contentStyle={{borderRadius: '30px', border: 'none'}}/><Line type="stepAfter" dataKey="xp" stroke={THEME.headerNavy} strokeWidth={6} dot={{r: 6, fill: THEME.secondary, stroke: 'black', strokeWidth: 2}} /></LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="h-96 rounded-[50px] border-[6px] p-10 bg-white/40 shadow-xl" style={{ borderColor: THEME.headerNavy }}>
                        <h4 className="text-center font-black text-[10px] uppercase opacity-30 tracking-[0.4em] mb-10">Consistency</h4>
                        <ResponsiveContainer width="100%" height="80%">
                            <LineChart data={chartData}><Tooltip contentStyle={{borderRadius: '30px', border: 'none'}}/><Line type="monotone" dataKey="habits" stroke={THEME.shopGreen} strokeWidth={6} dot={{r: 6, fill: THEME.white, stroke: 'black', strokeWidth: 2}} /></LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </ChartWrapper>
             <div className="space-y-10 bg-white/20 p-12 rounded-[60px] border-[6px]" style={{ borderColor: THEME.headerNavy }}>
                {habits.map(h => (
                    <div key={h.id} className="flex items-center gap-10">
                        <div className="w-52 py-4 rounded-full text-center text-white font-black text-xs uppercase tracking-widest italic shadow-lg" style={{ backgroundColor: THEME.headerNavy }}>{h.name}</div>
                        <div className="flex-1 flex flex-wrap gap-3">
                            {Array.from({length: 31}).map((_, i) => {
                                const day = (i+1).toString().padStart(2, '0')
                                const done = habitLogs.find(l => l.habit_id === h.id && l.date.endsWith(`-${day}`))?.completed
                                return <div key={i} className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center text-[10px] font-black transition-all ${done ? 'border-black' : 'border-black/5 opacity-20'}`} style={{ backgroundColor: done ? THEME.secondary : 'transparent', color: done ? THEME.white : THEME.ink }}>{i+1}</div>
                            })}
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* ==========================================
            🎁 SHOP TAB
        ========================================== */}
        {activeTab === 'Shop' && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700">
             <h3 className="text-6xl font-black italic tracking-[0.4em] mb-20 drop-shadow-sm uppercase">Reward Shop</h3>
             <div className="grid grid-cols-3 gap-12 w-full max-w-6xl">
                {rewards.sort((a,b) => Number(a.is_purchased) - Number(b.is_purchased)).map(r => (
                    <div key={r.id} className="aspect-square rounded-[60px] border-[6px] p-10 flex flex-col justify-between relative shadow-2xl transition-all group" 
                         style={{ backgroundColor: THEME.cardFill, borderColor: THEME.headerNavy, opacity: r.is_purchased ? 0.3 : 1 }}>
                        <button onClick={async () => { await supabase.from('rewards').delete().eq('id', r.id); fetchData() }} className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={22}/></button>
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            {availableXP < r.cost && !r.is_purchased && <Lock className="mb-4 opacity-20" size={40}/>}
                            <p className="text-3xl font-black italic leading-tight mb-2 uppercase">{r.title}</p>
                            <p className="text-sm font-bold opacity-30 uppercase tracking-widest">{r.cost} XP</p>
                        </div>
                        <button onClick={async () => {
                            if(availableXP < r.cost) return alert("🥨 Work harder! Not enough points.");
                            await supabase.from('rewards').update({ is_purchased: true }).eq('id', r.id); fetchData()
                        }} disabled={r.is_purchased} className="w-full py-5 rounded-[30px] text-white font-black uppercase text-sm shadow-[0_8px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all"
                           style={{ backgroundColor: r.is_purchased ? '#666' : (availableXP >= r.cost ? THEME.shopGreen : '#999') }}>
                            {r.is_purchased ? 'Purchased' : (availableXP >= r.cost ? 'Buy' : 'Locked')}
                        </button>
                    </div>
                ))}
                <button onClick={async () => {
                    const t = prompt("Reward Name?"); const c = prompt("XP (2000, 5000, 10000)?")
                    if(t && c) { await supabase.from('rewards').insert([{title: t, cost: parseInt(c)}]); fetchData() }
                }} className="aspect-square rounded-[60px] border-[6px] border-dashed border-black/10 flex flex-col items-center justify-center text-black/10 hover:text-black transition-all">
                    <Plus size={80}/><span className="font-black italic uppercase tracking-widest text-lg mt-4">Stock Reward</span>
                </button>
             </div>
          </div>
        )}

        {(activeTab === 'Profile' || activeTab === 'Calendar') && (
            <div className="h-full flex flex-col items-center justify-center opacity-5 font-black italic text-5xl uppercase tracking-[0.5em]">Construction Area</div>
        )}

      </main>
    </div>
  )
}