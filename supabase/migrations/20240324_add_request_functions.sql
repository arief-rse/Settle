-- Function to decrement request count
CREATE OR REPLACE FUNCTION public.decrement_request_count(user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    remaining INTEGER;
    subscription_active BOOLEAN;
BEGIN
    -- Check if user has an active subscription
    SELECT EXISTS (
        SELECT 1 
        FROM subscriptions 
        WHERE user_id = decrement_request_count.user_id 
        AND status = 'active'
        AND current_period_end > NOW()
    ) INTO subscription_active;

    -- Get current request count
    SELECT requests_remaining 
    INTO remaining
    FROM request_counts 
    WHERE user_id = decrement_request_count.user_id;

    IF remaining IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No request count found for user',
            'requests_remaining', 0
        );
    END IF;

    IF remaining <= 0 AND NOT subscription_active THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No requests remaining. Please subscribe to continue.',
            'requests_remaining', 0
        );
    END IF;

    -- If user has subscription, don't decrement below 0
    -- If no subscription, prevent going below 0
    UPDATE request_counts 
    SET 
        requests_remaining = CASE 
            WHEN subscription_active THEN GREATEST(requests_remaining - 1, 0)
            ELSE GREATEST(requests_remaining - 1, 0)
        END,
        total_requests = total_requests + 1
    WHERE user_id = decrement_request_count.user_id;

    -- Get updated remaining count
    SELECT requests_remaining 
    INTO remaining
    FROM request_counts 
    WHERE user_id = decrement_request_count.user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Request count decremented',
        'requests_remaining', remaining,
        'subscription_active', subscription_active
    );
END;
$$; 