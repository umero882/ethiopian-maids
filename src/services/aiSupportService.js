import supportService from '@/services/supportService';

/**
 * aiSupportService
 * Lightweight, local AI-style responder that uses FAQ matching and heuristics
 * to provide helpful, immediate answers without external API calls.
 */
class AISupportService {
  constructor() {
    this.maxSuggestions = 2;
  }

  // Simple FAQ-based response with heuristics
  respond = async ({ message, category, user }) => {
    // Try remote LLM endpoint first if configured
    const endpoint = import.meta?.env?.VITE_AI_SUPPORT_API_URL || '/api/ai-support';
    const useRemote = import.meta?.env?.VITE_AI_SUPPORT_USE_REMOTE !== 'false';
    if (useRemote && endpoint) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'ai-support',
          },
          body: JSON.stringify({ message, category, user }),
          signal: controller.signal,
        });
        clearTimeout(id);
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) {
            return { reply: data.reply, suggestions: [] };
          }
        }
      } catch (e) {
        // Silent fallback to heuristic
      }
    }
    const text = (message || '').trim().toLowerCase();
    const faqs = supportService.getFAQItems();

    // Category-weighted matching
    const scored = faqs
      .map((faq) => ({ faq, score: this.score(text, faq, category) }))
      .filter((s) => s.score > 0.15)
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, this.maxSuggestions);

    if (top.length > 0) {
      const best = top[0].faq;
      const suggestions = top.map((s) => ({ id: s.faq.id, title: s.faq.question }));
      return {
        reply:
          `${best.answer}\n\n` +
          `Would you like me to: ` +
          suggestions
            .map((s, i) => `${i + 1}. Read “${s.title}”`)
            .join('  '),
        suggestions,
      };
    }

    // Generic helpful fallback
    return {
      reply:
        "I can help with account, billing, matching, or technical issues. " +
        "Could you share a bit more detail (e.g., the page or action that failed)?",
      suggestions: [
        { id: 'faq-1', title: 'How long does it take to find a maid?' },
        { id: 'faq-3', title: 'How do I upgrade my subscription?' },
      ],
    };
  };

  score(text, faq, category) {
    const q = faq.question.toLowerCase();
    const a = faq.answer.toLowerCase();
    let score = 0;
    if (text && q.includes(text)) score += 0.6;
    // token overlap heuristic
    const tokens = new Set(text.split(/\W+/).filter(Boolean));
    let overlap = 0;
    tokens.forEach((t) => {
      if (q.includes(t)) overlap += 1;
      else if (a.includes(t)) overlap += 0.5;
    });
    score += Math.min(overlap / 6, 0.4);
    if (category && faq.category === category) score += 0.2;
    return Math.min(score, 1);
  }
}

export const aiSupportService = new AISupportService();
export default aiSupportService;
