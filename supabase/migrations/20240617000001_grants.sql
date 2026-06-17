-- Migration 004: Explicit Grants
GRANT ALL ON TABLE public.payment_links TO service_role;
GRANT ALL ON TABLE public.transactions TO service_role;
GRANT ALL ON TABLE public.payout_destinations TO service_role;
GRANT ALL ON TABLE public.token_prices TO service_role;
GRANT ALL ON TABLE public.email_logs TO service_role;

GRANT SELECT ON TABLE public.payment_links TO anon, authenticated;
GRANT SELECT ON TABLE public.transactions TO anon, authenticated;
GRANT SELECT ON TABLE public.payout_destinations TO anon, authenticated;
GRANT SELECT ON TABLE public.token_prices TO anon, authenticated;
