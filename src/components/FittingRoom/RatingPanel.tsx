import { useState } from 'react';
import { OutfitRating } from '@/services/outfitRating';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingPanelProps {
  rating: OutfitRating;
}

export function RatingPanel({ rating }: RatingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 border-green-200';
    if (score >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderProgressBar = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    return (
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${getProgressColor(score)}`}
        />
      </div>
    );
  };

  return (
    <Card className={`border-2 p-6 ${getScoreBgColor(rating.score)} transition-all`}>
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Outfit Rating</h3>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-5 w-5 text-gray-600" />
          <span className={`text-4xl font-bold ${getScoreColor(rating.score)}`}>
            {rating.score.toFixed(1)}
          </span>
          <span className="text-lg text-gray-600">/10</span>
        </motion.div>
      </div>

      {/* Toggle Breakdown Button */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mb-4 justify-between hover:bg-white/50"
      >
        <span className="font-medium">
          {isExpanded ? 'Hide Breakdown' : 'Show Breakdown'}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Expandable Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-300">
              {/* Score Components */}
              {rating.colorScore !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Color Harmony</span>
                    <span className={`font-bold ${getScoreColor(rating.colorScore)}`}>
                      {rating.colorScore.toFixed(1)}
                    </span>
                  </div>
                  {renderProgressBar(rating.colorScore)}
                </div>
              )}

              {rating.patternScore !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Pattern Balance</span>
                    <span className={`font-bold ${getScoreColor(rating.patternScore)}`}>
                      {rating.patternScore.toFixed(1)}
                    </span>
                  </div>
                  {renderProgressBar(rating.patternScore)}
                </div>
              )}

              {rating.typeScore !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Type Matching</span>
                    <span className={`font-bold ${getScoreColor(rating.typeScore)}`}>
                      {rating.typeScore.toFixed(1)}
                    </span>
                  </div>
                  {renderProgressBar(rating.typeScore)}
                </div>
              )}

              {/* Bonuses */}
              {rating.formalityBonus !== undefined && rating.formalityBonus !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Formality Bonus</span>
                  <span
                    className={`font-bold ${
                      rating.formalityBonus > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {rating.formalityBonus > 0 ? '+' : ''}
                    {rating.formalityBonus.toFixed(1)}
                  </span>
                </div>
              )}

              {rating.tagBonus !== undefined && rating.tagBonus !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Tags/Occasion Bonus</span>
                  <span
                    className={`font-bold ${
                      rating.tagBonus > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {rating.tagBonus > 0 ? '+' : ''}
                    {rating.tagBonus.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Feedback */}
      {rating.feedback.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Overall</h4>
          <ul className="space-y-1">
            {rating.feedback.map((msg, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {rating.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
            <span>✅</span>
            Strengths
          </h4>
          <ul className="space-y-1">
            {rating.strengths.map((msg, idx) => (
              <li key={idx} className="text-sm text-green-600 flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {rating.suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
            <span>💡</span>
            Suggestions
          </h4>
          <ul className="space-y-1">
            {rating.suggestions.map((msg, idx) => (
              <li key={idx} className="text-sm text-yellow-600 flex items-start gap-2">
                <span className="mt-0.5">→</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Feedback Placeholder */}
      <div className="pt-6 border-t border-gray-300">
        <Button
          variant="outline"
          className="w-full"
          disabled
          title="AI feedback will be available in a future update"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Get AI Feedback (Coming Soon)
        </Button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI-powered outfit analysis will be available soon
        </p>
      </div>
    </Card>
  );
}
