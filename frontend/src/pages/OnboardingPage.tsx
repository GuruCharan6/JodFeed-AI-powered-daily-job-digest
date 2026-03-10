import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfile } from '../api/profile'
import { showToast } from '../components/ui/Toast'
import WizardShell from '../components/onboarding/WizardShell'
import Step0Method from '../components/onboarding/Step0Method'
import Step1Resume from '../components/onboarding/Step1Resume'
import Step2Skills from '../components/onboarding/Step2Skills'
import Step3Roles from '../components/onboarding/Step3Roles'
import Step4Location from '../components/onboarding/Step4Location'
import Step5Companies from '../components/onboarding/Step5Companies'
import Step6Schedule from '../components/onboarding/Step6Schedule'
import Step7Experience from '../components/onboarding/Step7Experience'

interface ParsedData {
  skills: string[]
  target_roles: string[]
  locations: string[]
  full_name?: string
}

interface OnboardingData {
  method: 'resume' | 'manual' | null
  parsedData: ParsedData | null
  skills: string[]
  target_roles: string[]
  locations: string[]
  remote: boolean
  company_pref: string[]
  digest_type: 'daily' | 'custom'
  digest_time: string
  years_of_experience: number
  full_name: string
}

const STEP_CONFIGS = {
  resume: [
    { title: 'Choose setup method',  subtitle: 'How would you like to set up your profile?',                label: 'Method'    },
    { title: 'Upload your resume',   subtitle: 'AI will extract your skills and roles automatically',        label: 'Resume'    },
    { title: 'Review your skills',   subtitle: 'Confirm or update the skills AI extracted from your resume', label: 'Skills'    },
    { title: 'Review target roles',  subtitle: 'Confirm or update the roles AI detected for you',           label: 'Roles'     },
    { title: 'Work locations',       subtitle: 'Where do you want to work? Add up to 5 cities',             label: 'Location'  },
    { title: 'Company preferences', subtitle: 'What types of companies are you interested in?',             label: 'Companies' },
    { title: 'Email schedule',       subtitle: 'When should your daily digest arrive?',                     label: 'Schedule'  },
    { title: 'Your experience',      subtitle: 'Help us match jobs to your career level',                   label: 'Experience'},
  ],
  manual: [
    { title: 'Choose setup method',  subtitle: 'How would you like to set up your profile?',                label: 'Method'    },
    { title: 'Your skills',          subtitle: 'What technologies and tools do you work with?',             label: 'Skills'    },
    { title: 'Target roles',         subtitle: 'What job titles are you looking for?',                      label: 'Roles'     },
    { title: 'Work locations',       subtitle: 'Where do you want to work? Add up to 5 cities',             label: 'Location'  },
    { title: 'Company preferences', subtitle: 'What types of companies are you interested in?',             label: 'Companies' },
    { title: 'Email schedule',       subtitle: 'When should your daily digest arrive?',                     label: 'Schedule'  },
    { title: 'Your experience',      subtitle: 'Help us match jobs to your career level',                   label: 'Experience'},
  ],
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    method: null,
    parsedData: null,
    skills: [],
    target_roles: [],
    locations: [],
    remote: true,
    company_pref: [],
    digest_type: 'daily',
    digest_time: '09:00',
    years_of_experience: 0,
    full_name: '',
  })

  const config = data.method === 'resume' ? STEP_CONFIGS.resume : STEP_CONFIGS.manual
  const totalSteps = config.length
  const labels = config.map(c => c.label)
  const current = config[step] ?? config[0]

  const handleParsed = (parsed: ParsedData) => {
    setData(prev => ({
      ...prev,
      parsedData: parsed,
      skills:       parsed.skills?.length       ? parsed.skills       : prev.skills,
      target_roles: parsed.target_roles?.length ? parsed.target_roles : prev.target_roles,
      locations:    parsed.locations?.length    ? parsed.locations    : prev.locations,
      full_name:    parsed.full_name || prev.full_name,
    }))
  }

  const canProceed = (): boolean => {
    if (!data.method) return step === 0 ? false : true
    const isResume = data.method === 'resume'
    if (step === 0) return data.method !== null
    if (isResume && step === 1) return data.parsedData !== null
    const skillsStep = isResume ? 2 : 1
    if (step === skillsStep) return data.skills.length >= 1
    const rolesStep = isResume ? 3 : 2
    if (step === rolesStep) return data.target_roles.length >= 1
    const locStep = isResume ? 4 : 3
    if (step === locStep) return data.locations.length >= 1 || data.remote
    const compStep = isResume ? 5 : 4
    if (step === compStep) return data.company_pref.length >= 1
    return true
  }

  const handleNext = async () => {
    if (step === 0 && !data.method) return
    if (step < totalSteps - 1) { setStep(s => s + 1); return }
    setIsLoading(true)
    try {
      await saveProfile({
        full_name: data.full_name,
        skills: data.skills,
        target_roles: data.target_roles,
        locations: data.locations,
        remote: data.remote,
        company_pref: data.company_pref,
        digest_type: data.digest_type,
        digest_time: data.digest_time,
        years_of_experience: data.years_of_experience,
        onboarding_complete: true,
      })
      showToast.success('Profile saved — welcome to JobFeed')
      navigate('/dashboard')
    } catch {
      showToast.error('Failed to save. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => { if (step > 0) setStep(s => s - 1) }

  const renderStep = () => {
    const isResume = data.method === 'resume'
    if (step === 0) return <Step0Method value={data.method} onChange={m => setData(d => ({ ...d, method: m }))} />
    if (isResume) {
      if (step === 1) return <Step1Resume onParsed={handleParsed} parsedData={data.parsedData} />
      if (step === 2) return <Step2Skills value={data.skills} onChange={s => setData(d => ({ ...d, skills: s }))} />
      if (step === 3) return <Step3Roles value={data.target_roles} onChange={r => setData(d => ({ ...d, target_roles: r }))} />
      if (step === 4) return <Step4Location locations={data.locations} remote={data.remote} onChange={(locs, rem) => setData(d => ({ ...d, locations: locs, remote: rem }))} />
      if (step === 5) return <Step5Companies value={data.company_pref} onChange={c => setData(d => ({ ...d, company_pref: c }))} />
      if (step === 6) return <Step6Schedule digestType={data.digest_type} digestTime={data.digest_time} onTypeChange={t => setData(d => ({ ...d, digest_type: t }))} onTimeChange={t => setData(d => ({ ...d, digest_time: t }))} />
      if (step === 7) return <Step7Experience value={data.years_of_experience} onChange={e => setData(d => ({ ...d, years_of_experience: e }))} />
    }
    if (step === 1) return <Step2Skills value={data.skills} onChange={s => setData(d => ({ ...d, skills: s }))} />
    if (step === 2) return <Step3Roles value={data.target_roles} onChange={r => setData(d => ({ ...d, target_roles: r }))} />
    if (step === 3) return <Step4Location locations={data.locations} remote={data.remote} onChange={(locs, rem) => setData(d => ({ ...d, locations: locs, remote: rem }))} />
    if (step === 4) return <Step5Companies value={data.company_pref} onChange={c => setData(d => ({ ...d, company_pref: c }))} />
    if (step === 5) return <Step6Schedule digestType={data.digest_type} digestTime={data.digest_time} onTypeChange={t => setData(d => ({ ...d, digest_type: t }))} onTimeChange={t => setData(d => ({ ...d, digest_time: t }))} />
    if (step === 6) return <Step7Experience value={data.years_of_experience} onChange={e => setData(d => ({ ...d, years_of_experience: e }))} />
    return null
  }

  return (
    <WizardShell
      step={step + 1}
      totalSteps={totalSteps}
      title={current.title}
      subtitle={current.subtitle}
      stepLabels={labels}
      onNext={handleNext}
      onBack={step > 0 ? handleBack : undefined}
      isLast={step === totalSteps - 1}
      isLoading={isLoading}
      canProceed={canProceed()}
    >
      {renderStep()}
    </WizardShell>
  )
}