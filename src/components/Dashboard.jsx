import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useMemo } from 'react';
import { Activity, BookOpen, CheckCircle, Zap, ArrowRight, PlaySquare, Layers, BrainCircuit, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

import RetentionCurve from './RetentionCurve';
import SubjectBreakdown from './SubjectBreakdown';
import WeakAreaInsights from './WeakAreaInsights';
import ActivityHeatmap from './ActivityHeatmap';

export default function Dashboard() {
	const store = useStore();

	// 1. RETENTION SCORE
	const retentionScore = useMemo(() => {
		let totalS = 0;
		let count = 0;
		store.decks.forEach(deck => {
			deck.cards.forEach(c => {
				totalS += (c.card?.stability || 1);
				count++;
			});
		});
		const avgStability = count > 0 ? (totalS / count) : 0;
		// Map stability (roughly 1 to 10+ days) to a 0-100 score. Just a visual heuristic.
		let score = count === 0 ? 0 : Math.min(100, Math.round((avgStability / 5) * 100));
		// If we have no cards, show 0.
		if (count === 0) score = 0;
		return score;
	}, [store.decks]);

	const retentionColor = retentionScore > 70 ? 'text-success' : (retentionScore >= 40 ? 'text-warning' : 'text-error');
	const retentionStrokeColor = retentionScore > 70 ? 'var(--color-success)' : (retentionScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)');
	const offset = 100 - retentionScore; // because stroke-dasharray is 100

	// 2. DAILY STREAK + 7-Day heatmap
	const streakDays = store.streakDays || 0;
	const last7Days = useMemo(() => {
		const arr = [];
		const today = new Date();
		for (let i = 6; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			const str = d.toISOString().split('T')[0];
			arr.push({ date: str, active: !!store.studyActivityLog?.[str] });
		}
		return arr;
	}, [store.studyActivityLog]);

	// 3. CARDS DUE TODAY
	const cardsDue = useMemo(() => {
		const now = new Date();
		let count = 0;
		store.decks.forEach(deck => {
			deck.cards.forEach(c => {
				if (c.card && new Date(c.card.due) <= now) count++;
			});
		});
		return count;
	}, [store.decks]);

	// 4. WEAK AREAS
	const weakAreas = useMemo(() => {
		if (!store.quizResults || store.quizResults.length === 0) return [];
		const map = new Map();
		store.quizResults.forEach((q) => {
			const topic = q.topic || 'General';
			if (!map.has(topic)) map.set(topic, { correct: 0, total: 0 });
			const d = map.get(topic);
			d.correct += q.score;
			d.total += q.total;
		});
		const weak = Array.from(map.entries())
			.map(([topic, stats]) => ({ topic, acc: (stats.correct / stats.total) * 100 }))
			.filter(w => w.acc < 60)
			.sort((a, b) => a.acc - b.acc)
			.slice(0, 2);
		return weak.length > 0 ? weak : [{ topic: 'None detected', acc: 100 }];
	}, [store.quizResults]);

	const recentTopics = store.recentActivity?.length > 0 ? store.recentActivity : [
		{ type: 'Info', title: 'Begin your learning journey', score: '-', date: 'Now' }
	];

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.1 }
		}
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
	};

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="max-w-[1100px] mx-auto flex flex-col gap-10 pb-16"
		>
			<header className="flex flex-col gap-3">
				<h1 className="text-4xl font-bold tracking-tight text-text-primary font-serif">
					Welcome back, {store.studyProfile?.name || 'soob'}
				</h1>
				<p className="text-lg text-text-secondary">
					Here is your learning progress for today. Keep up the great work.
				</p>
			</header>

			{/* PART 1: REVAMPED METRICS SECTION */}
			<motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

				{/* Metric 1: Retention Score */}
				<Card className="hover:-translate-y-1 transition-transform duration-300 overflow-hidden relative">
					<CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
						<CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-[0.08em]">
							Retention Score
						</CardTitle>
						<Target className="h-4 w-4 text-text-secondary" />
					</CardHeader>
					<CardContent className="flex items-center justify-between z-10 relative">
						<div>
							<div className="text-4xl font-bold text-text-primary font-serif">{retentionScore}</div>
							<p className="text-xs text-text-tertiary mt-2">Overall memory strength</p>
						</div>
						<div className="relative w-16 h-16 flex items-center justify-center">
							<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
								<circle cx="18" cy="18" r="16" fill="none" className="stroke-bg-tertiary" strokeWidth="3" />
								<circle
									cx="18" cy="18" r="16"
									fill="none"
									stroke={retentionStrokeColor}
									strokeWidth="3"
									strokeDasharray="100 100"
									strokeDashoffset={offset}
									strokeLinecap="round"
									className="transition-all duration-1000 ease-out"
								/>
							</svg>
							<div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${retentionColor}`}>
								{retentionScore}%
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Metric 2: Daily Streak */}
				<Card className="hover:-translate-y-1 transition-transform duration-300">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-[0.08em]">
							Daily Streak
						</CardTitle>
						<Zap className="h-4 w-4 text-accent-warm" />
					</CardHeader>
					<CardContent>
						<div className="text-4xl font-bold text-text-primary font-serif flex items-baseline gap-2">
							{streakDays} <span className="text-sm text-text-tertiary font-sans font-normal uppercase tracking-wider">Days</span>
						</div>
						<div className="flex gap-1 mt-3">
							{last7Days.map((day, i) => (
								<div
									key={i}
									title={day.date}
									className={`w-4 h-4 rounded-sm ${day.active ? 'bg-accent-warm shadow-[0_0_5px_rgba(242,125,76,0.3)]' : 'bg-bg-tertiary'}`}
								/>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Metric 3: Cards Due Today */}
				<Card className={`hover:-translate-y-1 transition-transform duration-300 ${cardsDue > 20 ? 'border-error/40 bg-error/5' : ''}`}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className={`text-xs font-semibold uppercase tracking-[0.08em] ${cardsDue > 20 ? 'text-error font-bold' : 'text-text-secondary'}`}>
							Cards Due Today
						</CardTitle>
						<Layers className={`h-4 w-4 ${cardsDue > 20 ? 'text-error' : 'text-text-primary'}`} />
					</CardHeader>
					<CardContent>
						<div className={`text-4xl font-bold font-serif ${cardsDue > 20 ? 'text-error' : 'text-text-primary'}`}>{cardsDue}</div>
						<p className="text-xs text-text-tertiary mt-2 flex items-center gap-1">
							{cardsDue > 20 && <AlertTriangle size={12} className="text-warning" />}
							{cardsDue > 20 ? 'High review load today' : 'Manageable workload'}
						</p>
					</CardContent>
				</Card>

				{/* Metric 4: Weak Areas */}
				<Card className="hover:-translate-y-1 transition-transform duration-300">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-[0.08em]">
							Weak Areas
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-error" />
					</CardHeader>
					<CardContent className="flex flex-col justify-end h-[calc(100%-40px)]">
						<div className="flex flex-col gap-2">
							{weakAreas.map((wa, i) => (
								<div key={i} className={`text-xs px-2.5 py-1.5 rounded-sm border truncate font-medium ${wa.acc < 100 ? 'bg-error/10 border-error/30 text-error' : 'bg-success/10 border-success/30 text-success'}`}>
									{wa.topic}
								</div>
							))}
						</div>
					</CardContent>
				</Card>

			</motion.div>



			{/* PART 2: PERFORMANCE ANALYTICS SECTION */}
			<motion.div variants={itemVariants} className="mt-6 flex flex-col gap-6">
				<div className="flex items-center gap-2 text-text-primary font-bold font-serif text-2xl border-b border-bg-tertiary pb-4">
					<Activity className="text-accent-warm" /> Performance Analytics
				</div>

				<div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">

					{/* PANEL A: Forgetting Curve */}
					<Card className="flex-[6_6_0%] bg-bg-secondary border-bg-tertiary flex flex-col">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg">Forgetting Curve & Retention</CardTitle>
							<CardDescription>Analyze your memory decay over 30 days based on your actual flashcard stability.</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col pt-4 relative min-h-[250px] justify-end">
							<RetentionCurve />
						</CardContent>
					</Card>

					{/* PANEL B: Subject Breakdown */}
					<Card className="flex-[4_4_0%] bg-bg-secondary border-bg-tertiary flex flex-col">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg">Subject Breakdown</CardTitle>
							<CardDescription>Accuracy and trend tracking across all your tested topics.</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 pt-4">
							<SubjectBreakdown />
						</CardContent>
					</Card>

				</div>
			</motion.div>

			{/* PART 3: WEAK AREA AI ANALYSIS */}
			<motion.div variants={itemVariants}>
				<WeakAreaInsights />
			</motion.div>

			{/* PART 4: STUDY ACTIVITY HEATMAP */}
			<motion.div variants={itemVariants} className="mt-8">
				<Card className="border-bg-tertiary bg-transparent lg:bg-bg-secondary shadow-none lg:shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">Study Consistency</CardTitle>
						<CardDescription>Your 12-week contribution chart. Every session counts.</CardDescription>
					</CardHeader>
					<CardContent>
						<ActivityHeatmap />
					</CardContent>
				</Card>
			</motion.div>

			{/* PART 5: RECENT ACTIVITY & QUICK START */}
			<motion.div variants={itemVariants} className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
				<Card className="lg:col-span-2 flex flex-col">
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Your latest interactions across the platform.</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 flex flex-col gap-4">
						{recentTopics.map((topic, i) => {
							// Route mapping based on activity type
							let targetRoute = "/";
							if (topic.type === 'Quiz') targetRoute = "/quiz";
							else if (topic.type === 'Flashcards') targetRoute = "/spaced";
							else if (topic.type === 'RAG Tutor') targetRoute = "/tutor";
							else if (topic.type === 'Video Notes') targetRoute = "/video";

							return (
								<Link key={i} to={targetRoute} className="flex items-center justify-between p-4 rounded-md bg-bg border border-bg-tertiary hover:border-text-tertiary transition-colors group cursor-pointer">
									<div className="flex items-center gap-4">
										<div className="p-2 bg-text-primary text-white rounded-[4px]">
											{topic.type === 'Quiz' && <Activity size={18} strokeWidth={2.5} />}
											{topic.type === 'Flashcards' && <Layers size={18} strokeWidth={2.5} />}
											{topic.type === 'RAG Tutor' && <BrainCircuit size={18} strokeWidth={2.5} />}
											{topic.type === 'Video Notes' && <PlaySquare size={18} strokeWidth={2.5} />}
											{topic.type === 'Info' && <BookOpen size={18} strokeWidth={2.5} />}
										</div>
										<div>
											<h4 className="font-semibold text-text-primary">{topic.title}</h4>
											<p className="text-xs text-text-secondary mt-0.5 whitespace-nowrap">{topic.type} • {topic.date}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<span className="font-medium text-text-primary">{topic.score}</span>
										<ArrowRight size={16} className="text-text-secondary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
									</div>
								</Link>
							);
						})}
					</CardContent>
				</Card>

				<Card className="flex flex-col bg-bg-secondary border-bg-tertiary relative overflow-hidden">
					<CardHeader>
						<CardTitle>Quick Start</CardTitle>
						<CardDescription>Jump right back into learning.</CardDescription>
					</CardHeader>
					<CardContent className="flex-1 flex flex-col gap-3 mt-2">
						<Link to="/quiz" className="w-full">
							<Button className="w-full justify-between shadow-sm" variant="default" size="lg">
								<span className="flex items-center gap-2"><Activity size={18} /> Start Practice Quiz</span>
								<ArrowRight size={18} />
							</Button>
						</Link>

						<Link to="/spaced" className="w-full">
							<Button className="w-full justify-between" variant="secondary" size="lg">
								<span className="flex items-center gap-2"><Layers size={18} /> Review Flashcards</span>
								{cardsDue > 0 && <span className="bg-text-primary text-white px-2 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider font-bold">{cardsDue} Due</span>}
							</Button>
						</Link>

						<Link to="/tutor" className="w-full">
							<Button className="w-full justify-between" variant="secondary" size="lg">
								<span className="flex items-center gap-2"><BrainCircuit size={18} /> Ask AI Tutor</span>
								<ArrowRight size={18} className="text-text-tertiary" />
							</Button>
						</Link>

						<div className="mt-auto pt-6 px-2 text-center">
							<p className="text-xs text-text-secondary leading-relaxed">
								<strong className="text-text-primary font-semibold uppercase tracking-[0.06em]">Tip </strong>
								You learn 40% faster by using Spaced Repetition flashcards daily.
							</p>
						</div>
					</CardContent>
				</Card>
			</motion.div>

		</motion.div>
	);
}

