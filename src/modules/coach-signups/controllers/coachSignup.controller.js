const httpStatus = require('http-status');
const catchAsync = require('../../../utils/catchAsync');
const coachSignupService = require('../services/coachSignup.service');
const {
  getSingleAcademyForUser,
} = require('../../academy/services/academy.service');

const initiateCoachSignupHandler = catchAsync(async (req, res) => {
  const academy = await getSingleAcademyForUser(req.user);

  const signup = await coachSignupService.initiateCoachSignup(
    req.body,
    academy.id
  );
  res.status(httpStatus.CREATED).send(signup);
});

const updateCoachSignupHandler = catchAsync(async (req, res) => {
  const { signupId } = req.params;
  const updatedSignup = await coachSignupService.updateCoachSignup(
    signupId,
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send(updatedSignup);
});

const verifyCoachSignupOTPHandler = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const verifiedSignup = await coachSignupService.verifyCoachSignupOTP(
    email,
    otp
  );
  res.status(httpStatus.OK).send(verifiedSignup);
});

const completeCoachSignupHandler = catchAsync(async (req, res) => {
  const { signupId } = req.params;
  const { password, profileData } = req.body;
  const completedSignup = await coachSignupService.completeCoachSignup(
    signupId,
    password,
    profileData,
    req.user
  );
  res.status(httpStatus.OK).send(completedSignup);
});

const getCoachSignupByIdHandler = catchAsync(async (req, res) => {
  const { signupId } = req.params;
  const signup = await coachSignupService.getCoachSignupById(signupId);
  res.status(httpStatus.OK).send(signup);
});

const fetchAllCoachSignupsHandler = catchAsync(async (req, res) => {
  const { page, limit, search, status, stage, academyId } = req.query;
  const signups = await coachSignupService.fetchAllCoachSignups({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    search,
    status,
    stage,
    academyId,
  });
  res.status(httpStatus.OK).send(signups);
});

const coachSignupController = {
  initiateCoachSignupHandler,
  updateCoachSignupHandler,
  verifyCoachSignupOTPHandler,
  completeCoachSignupHandler,
  getCoachSignupByIdHandler,
  fetchAllCoachSignupsHandler,
};

module.exports = coachSignupController;
