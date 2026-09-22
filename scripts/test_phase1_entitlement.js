const crypto = require('crypto');

// Simulated database
const mockDb = {
  profiles: {
    'user_alpha': {
      id: 'user_alpha',
      email: 'alpha@example.com',
      plan_tier: 'starter',
      paid_credits: 50,
      subscription_status: 'inactive',
      subscription_expiry: null,
      last_payment_id: null,
    },
    'user_beta': {
      id: 'user_beta',
      email: 'beta@example.com',
      plan_tier: 'free',
      paid_credits: 10,
      subscription_status: 'inactive',
      subscription_expiry: null,
      last_payment_id: null,
    },
  },
};

function getCreditsForPlan(planTier) {
  const tier = planTier.toLowerCase();
  if (tier === 'scale') return 2000;
  if (tier === 'growth') return 500;
  if (tier === 'starter' || tier === 'pro') return 250;
  return 100;
}

// Emulating grantEntitlement logic
async function mockGrantEntitlement({ userId, orderId, paymentId, planTier, source, shouldFailDb = false }) {
  if (shouldFailDb) {
    throw new Error('Database connection timeout (simulated failure)');
  }

  const profile = mockDb.profiles[userId];
  if (!profile) {
    throw new Error(`Profile not found for ${userId}`);
  }

  // 1. Idempotency check
  if (profile.last_payment_id === paymentId) {
    return {
      success: true,
      alreadyProcessed: true,
      userId,
      planTier: profile.plan_tier,
      creditsAdded: 0,
      totalCredits: profile.paid_credits,
      expiryDate: profile.subscription_expiry,
    };
  }

  // 2. Increment credits and compute 30-day expiry
  const creditsToAdd = getCreditsForPlan(planTier);
  const currentCredits = profile.paid_credits || 0;
  const newCredits = currentCredits + creditsToAdd;
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // 3. Update database
  profile.plan_tier = planTier;
  profile.subscription_status = 'active';
  profile.subscription_expiry = expiryDate;
  profile.paid_credits = newCredits;
  profile.last_payment_id = paymentId;
  profile.last_order_id = orderId;

  return {
    success: true,
    alreadyProcessed: false,
    userId,
    planTier,
    creditsAdded: creditsToAdd,
    totalCredits: newCredits,
    expiryDate,
  };
}

// Emulating verify-payment route handler
async function mockVerifyPaymentRoute({
  body,
  sessionUser,
  secret = 'test_secret_key',
  shouldFailDb = false,
}) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planTier, userId } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { status: 400, data: { success: false, error: 'Missing payment verification fields' } };
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const expectedBuf = Buffer.from(expectedSignature);
  const receivedBuf = Buffer.from(razorpay_signature);

  if (expectedBuf.length !== receivedBuf.length) {
    return { status: 401, data: { success: false, error: 'Invalid signature length' } };
  }

  if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return { status: 401, data: { success: false, error: 'Invalid payment signature' } };
  }

  // Session priority: sessionUser ALWAYS takes precedence over body.userId
  let targetUserId = undefined;
  if (sessionUser && sessionUser.id) {
    targetUserId = sessionUser.id;
  } else if (userId) {
    targetUserId = userId;
  }

  if (!targetUserId) {
    return {
      status: 401,
      data: { success: false, error: 'Payment verified, but user session not found.' },
    };
  }

  try {
    const entitlementResult = await mockGrantEntitlement({
      userId: targetUserId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planTier: planTier || 'growth',
      source: 'verify_payment',
      shouldFailDb,
    });

    return {
      status: 200,
      data: {
        success: true,
        message: 'Payment verified and entitlement granted successfully',
        entitlement: entitlementResult,
      },
    };
  } catch (dbError) {
    return {
      status: 500,
      data: {
        success: false,
        critical: true,
        error:
          'Payment received, but entitlement activation failed. Please contact support with Payment ID: ' +
          razorpay_payment_id,
        details: dbError.message,
      },
    };
  }
}

async function runTests() {
  const secret = 'rzp_test_secret_9988';
  console.log('=====================================================================');
  console.log('RUNNING PHASE 1 AUTOMATED TESTS');
  console.log('=====================================================================\n');

  // Test 1: HAPPY PATH
  console.log('[TEST 1: HAPPY PATH]');
  const orderId1 = 'order_test_1001';
  const paymentId1 = 'pay_test_2001';
  const sig1 = crypto.createHmac('sha256', secret).update(`${orderId1}|${paymentId1}`).digest('hex');
  const initialCredits = mockDb.profiles['user_alpha'].paid_credits; // 50

  const res1 = await mockVerifyPaymentRoute({
    body: {
      razorpay_order_id: orderId1,
      razorpay_payment_id: paymentId1,
      razorpay_signature: sig1,
      planTier: 'growth',
    },
    sessionUser: { id: 'user_alpha', email: 'alpha@example.com' },
    secret,
  });

  const updatedUserAlpha = mockDb.profiles['user_alpha'];
  const test1Pass =
    res1.status === 200 &&
    res1.data.success === true &&
    updatedUserAlpha.plan_tier === 'growth' &&
    updatedUserAlpha.subscription_status === 'active' &&
    updatedUserAlpha.paid_credits === initialCredits + 500 && // 50 + 500 = 550
    updatedUserAlpha.last_payment_id === paymentId1;

  console.log('HTTP Status:', res1.status);
  console.log('Entitlement Result:', res1.data.entitlement);
  console.log('Profile State in DB:', updatedUserAlpha);
  console.log('>>> TEST 1 RESULT:', test1Pass ? 'PASSED ✅' : 'FAILED ❌', '\n');

  // Test 2: IDEMPOTENCY
  console.log('[TEST 2: IDEMPOTENCY (Double-crediting guard)]');
  const creditBeforeRetry = updatedUserAlpha.paid_credits; // 550

  const res2 = await mockVerifyPaymentRoute({
    body: {
      razorpay_order_id: orderId1,
      razorpay_payment_id: paymentId1,
      razorpay_signature: sig1,
      planTier: 'growth',
    },
    sessionUser: { id: 'user_alpha', email: 'alpha@example.com' },
    secret,
  });

  const creditAfterRetry = mockDb.profiles['user_alpha'].paid_credits;
  const test2Pass =
    res2.status === 200 &&
    res2.data.success === true &&
    res2.data.entitlement.alreadyProcessed === true &&
    res2.data.entitlement.creditsAdded === 0 &&
    creditBeforeRetry === creditAfterRetry;

  console.log('HTTP Status:', res2.status);
  console.log('Response alreadyProcessed:', res2.data.entitlement.alreadyProcessed);
  console.log(`Credits before retry: ${creditBeforeRetry}, Credits after retry: ${creditAfterRetry}`);
  console.log('>>> TEST 2 RESULT:', test2Pass ? 'PASSED ✅' : 'FAILED ❌', '\n');

  // Test 3: DB FAILURE SIMULATION
  console.log('[TEST 3: DB FAILURE AFTER VALID SIGNATURE]');
  const orderId3 = 'order_test_1003';
  const paymentId3 = 'pay_test_2003';
  const sig3 = crypto.createHmac('sha256', secret).update(`${orderId3}|${paymentId3}`).digest('hex');

  const res3 = await mockVerifyPaymentRoute({
    body: {
      razorpay_order_id: orderId3,
      razorpay_payment_id: paymentId3,
      razorpay_signature: sig3,
      planTier: 'scale',
    },
    sessionUser: { id: 'user_alpha' },
    secret,
    shouldFailDb: true,
  });

  const test3Pass =
    res3.status === 500 &&
    res3.data.success === false &&
    res3.data.critical === true &&
    res3.data.error.includes('contact support');

  console.log('HTTP Status:', res3.status);
  console.log('Response Body:', res3.data);
  console.log('>>> TEST 3 RESULT:', test3Pass ? 'PASSED ✅' : 'FAILED ❌', '\n');

  // Test 4: USER MISMATCH / ATTACK ATTEMPT
  console.log('[TEST 4: USER MISMATCH (Session User A vs Body User B)]');
  const orderId4 = 'order_test_1004';
  const paymentId4 = 'pay_test_2004';
  const sig4 = crypto.createHmac('sha256', secret).update(`${orderId4}|${paymentId4}`).digest('hex');
  const userBetaCreditsBefore = mockDb.profiles['user_beta'].paid_credits; // 10
  const userAlphaCreditsBefore = mockDb.profiles['user_alpha'].paid_credits; // 550

  const res4 = await mockVerifyPaymentRoute({
    body: {
      razorpay_order_id: orderId4,
      razorpay_payment_id: paymentId4,
      razorpay_signature: sig4,
      planTier: 'growth',
      userId: 'user_beta', // Attempting to pass User B in body while logged in as User A
    },
    sessionUser: { id: 'user_alpha', email: 'alpha@example.com' },
    secret,
  });

  const userBetaCreditsAfter = mockDb.profiles['user_beta'].paid_credits;
  const userAlphaCreditsAfter = mockDb.profiles['user_alpha'].paid_credits;

  const test4Pass =
    res4.status === 200 &&
    res4.data.entitlement.userId === 'user_alpha' &&
    userAlphaCreditsAfter === userAlphaCreditsBefore + 500 &&
    userBetaCreditsAfter === userBetaCreditsBefore;

  console.log('Authenticated User in Session:', 'user_alpha');
  console.log('Attacker-injected User in Body:', 'user_beta');
  console.log('Entitled User ID:', res4.data.entitlement.userId);
  console.log(`User Alpha Credits: ${userAlphaCreditsBefore} -> ${userAlphaCreditsAfter}`);
  console.log(`User Beta Credits: ${userBetaCreditsBefore} -> ${userBetaCreditsAfter} (Untouched)`);
  console.log('>>> TEST 4 RESULT:', test4Pass ? 'PASSED ✅' : 'FAILED ❌', '\n');

  const allPassed = test1Pass && test2Pass && test3Pass && test4Pass;
  console.log('=====================================================================');
  console.log('ALL PHASE 1 TESTS:', allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌');
  console.log('=====================================================================');
}

runTests().catch(console.error);
