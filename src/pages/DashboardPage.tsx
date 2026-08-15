
import { Check, Crown } from 'lucide-react';
import { Button, Label } from '../ui/UI';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../context/authStore';

import type { SubscriptionPlan, UserWithAttemptSummary } from '../hooks/Utils';

interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  price: number;
  currency: string;
  period: string;
  buttonText: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  badge?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  user: UserWithAttemptSummary | null;
  handleAction: (id: SubscriptionPlan) => void;
}

const PricingCard = ({ plan, user, handleAction }: PricingCardProps) => {
  const isCurrentPlan = Boolean(user?.is_subscription && user.subscription === plan.id);

  return (
    <div className={`relative bg-base-200/50 border rounded-3xl p-8 flex flex-col h-full transition-all duration-300 ${
      plan.isPopular ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-xl' : 'border-base-300'
    }`}>
      {plan.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-content text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
          {plan.badge}
        </span>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{plan.name}</h2>
        <p className="text-sm text-base-400 mt-1">{plan.tagline}</p>
      </div>
      <div className="mb-6">
        <span className="text-5xl font-black">{plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
        {plan.price > 0 && <span className="text-base-400 ml-1 font-medium">/{plan.period}</span>}
      </div>
      {
          !user?.is_subscription ? 
              <>
                  <Button
                    size='lg'
                    label={isCurrentPlan ? 'Active Plan' : plan.buttonText}
                    variant={plan.isPopular ? 'primary' : 'ghost'}
                    className="w-full mb-6 py-6"
                    onClick={() => handleAction(plan.id)}
                    loading={isCurrentPlan}
                  />
              </>
            :
            <Label><p className='text-lime-500'>user is subscription</p></Label>
      }
      
      <p className="text-xs text-base-400 mb-4 italic">{plan.description}</p>
      <ul className="space-y-4 text-sm grow border-t border-base-300/50 pt-4 bg-base-100/90">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex gap-3 items-start">
            <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <span className=" text-base-content capitalize">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function PricingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user) as UserWithAttemptSummary | null;
  //const [isYearly, setIsYearly] = useState(true);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Targeted and fragmented practice',
      price: 0,
      currency: 'USD',
      period: 'forever',
      buttonText: 'Start Now',
      description: 'Perfect for practicing by module, question type, section, and task without full exam pressure.',
      features: [
        'Flexible training by module',
        'Targeted practice by question type',
        'Equivalent to a fragmented full test',
        'No access to full exam simulations',
        'No option to retake tests'
      ],
    },
    {
      id: 'pro',
      name: 'AILA Pro',
      tagline: 'The perfect balance for success',
      price: 49.99,
      currency: 'USD',
      period: 'month',
      buttonText: 'Upgrade to Pro',
      isPopular: true,
      badge: 'Most Popular',
      description: 'Real exam simulations with 2 full tests, countdown timer, and AI-powered feedback.',
      features: [
        'Everything included in Free',
        '2 full exams (4 complete modules)',
        'Real exam simulation with timer',
        'Intelligent feedback powered by AI',
        'Exclusive access to flash quizzes',
        'Unlimited access to retake tests'
      ],
    },
    {
      id: 'unlimited',
      name: 'AILA Ultimate',
      tagline: 'Intensive and evolving preparation',
      price: 99.99 ,
      currency: 'USD',
      period: 'month',
      buttonText: 'Go Ultimate',
      description: 'Extended access with an unlimited exam generation engine and continuously updated content.',
      features: [
        'Everything included in Pro',
        'Double volume: 4 modules of your choice',
        'Custom full exam generator tool',
        'New content added every 2 weeks',
        'Continuous platform updates & tracking',
        'Unlimited retakes on generated exams'
      ],
    }
  ];

  const handleAction = (planId: SubscriptionPlan) => {
    if (planId === 'free') {
      navigate('/choose');
    } else if (!user?.is_subscription) {
      navigate(`/payment?plan=${planId}&billing=${'monthly'}`);
    }
  };

  const activePlanName = plans.find(p => p.id === user?.subscription)?.name || 'Premium';

  return (
    <div className="w-full bg-base-100 min-h-screen py-16 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center">

        <Label>
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight">
            Ace the IELTS with AI
          </h1>
        </Label>
        <p className="text-base-400 text-center mb-8 max-w-lg">
          Choose the plan that fits your study timeline. Cancel anytime.
        </p>

        {/* Dynamic Subscription Banner */}
        {user?.is_subscription && (
          <div className="mb-12 w-full max-w-xl bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 shadow-sm animate-fade-in">
            <Crown className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-bold text-primary">You are currently on the {activePlanName} Plan</p>
              {user.subscription_expires_at && (
                <p className="text-xs opacity-80">
                  Your subscription is active until {new Date(user.subscription_expires_at).toLocaleDateString()}.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cards Layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl items-stretch pt-4">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} user={user} handleAction={handleAction} />
          ))}
        </div>
      </div>
    </div>
  );
}