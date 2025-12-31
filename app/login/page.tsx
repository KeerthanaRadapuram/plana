'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleAuth = async (type: 'LOGIN' | 'SIGNUP') => {
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    
    if (error) alert(error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#D6D2C4' }}>
      <div className="bg-white border-[6px] border-[#474A68] p-12 rounded-[60px] shadow-2xl max-w-md w-full text-center">
        <h1 className="text-5xl font-black italic mb-2" style={{ color: '#2945A8' }}>plana</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 opacity-80">Your Life OS awaits</p>
        
        <input type="email" placeholder="Email" className="w-full p-4 mb-4 rounded-2xl border-4 border-[#444444] outline-none font-bold" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="w-full p-4 mb-8 rounded-2xl border-4 border-[#444444] outline-none font-bold" value={password} onChange={e => setPassword(e.target.value)} />
        
        <div className="flex flex-col gap-4">
            <button onClick={() => handleAuth('LOGIN')} className="w-full py-4 bg-[#2945A8] text-white rounded-3xl font-black shadow-[0_6px_0_0_#2D3436] active:translate-y-1">ENTER SITE</button>
            <button onClick={() => handleAuth('SIGNUP')} className="text-xs font-black opacity-40 hover:opacity-100 uppercase tracking-widest">Create New Account</button>
        </div>
      </div>
    </div>
  )
}