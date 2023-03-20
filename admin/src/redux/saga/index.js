import { LocalStore } from "@app/utils/local-storage";
import { replace } from "connected-react-router";
import { envName } from "@app/configs";
import { call, put, select, takeLatest } from "@redux-saga/core/effects";
import { POST } from "@app/request";
import { AppConst } from "@app/redux/reducers";
import { removeLoading } from "@app/utils";
import history from "@app/utils/history";

const getRouter = (state) => state.router;

function* profile() {
  return yield POST("/admin/getProfile");
}

function* loadUser() {
  const router = yield select(getRouter);
  const user = LocalStore.local.get(`${envName}-uuid`);

  const { data: statusOfProfile } = yield call(profile);

  console.log({statusOfProfile})
  if (!user || Object.values(user).length === 0) {
    yield put({
      type: AppConst.LOAD_PROFILE_SUCCESS,
      payload: statusOfProfile?.data,
    });
    yield put({
      type: AppConst.LOAD_USER_ERROR,
    });

    removeLoading();
    yield redirectToAuth(statusOfProfile?.data);
    return;
  }

  if (user && user?._id) {
    yield put({
      type: AppConst.LOAD_PROFILE_SUCCESS,
      payload: statusOfProfile?.data,
    });
    yield put({
      type: AppConst.LOAD_USER_SUCCESS,
      payload: {
        ...user,
        role: {
          title: process.env.EMAIL === user?.email ? 'viewer' : 'admin'
        }
      },
    });
    yield redirectToAuth(1, true);
  } else {
    yield put({
      type: AppConst.LOAD_PROFILE_SUCCESS,
      payload: statusOfProfile?.data,
    });
    yield put({
      type: AppConst.LOAD_USER_ERROR,
    });

    yield redirectToAuth(statusOfProfile?.data);
  }

  removeLoading();
}

function* redirectToAuth(statusOfProfile, isLogin = false) {
  const router = yield select(getRouter);
  const pathname = router?.location?.pathname


  if(isLogin && ['/signup', "/reset-password", '/request-password', '/success', '/login']?.includes(pathname)) {
    history?.replace('/')
    return;
  }

  if (statusOfProfile === 0 && !isLogin) {
    if(!['/signup']?.includes(pathname) || ["/reset-password", '/request-password', '/success']?.includes(pathname)) {
      history?.replace('/signup')
    }
  } else if (statusOfProfile === 1 && !isLogin) {
    if(!['/login']?.includes(pathname) || ["/reset-password", '/request-password', '/success']?.includes(pathname) ) {
      history?.replace('/login')
    }
  }
}

export default function* AppSaga() {
  yield takeLatest(AppConst.LOAD_USER, loadUser);
}
