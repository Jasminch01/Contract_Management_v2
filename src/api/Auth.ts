import { instance } from "./api";
interface LoginResponse {
  token?: string;
  message?: string;
}

export const userLogin = async (email: string, userId: string) => {
  try {
    const res = await instance.post(`auth/login`, {
      email,
      userId,
    });
    
    // Store token in localStorage for header-based auth
    if (res?.data?.token) {
      localStorage.setItem("token", res.data.token);
    }
    
    return res;
  } catch (error) {
    throw error; 
  }
};

export const userLogOut = async () => {
  try {
    const res = await instance.post(`auth/logout`);
    // Clear token from localStorage
    localStorage.removeItem("token");
    return res;
  } catch (error) {
    throw error;
  }
};

export const userUpdateCredentials = async (
  email: string,
  password: string
) => {
  try {
    const res = await instance.post(`auth/update-credentials`, {
      email,
      password,
    });
    return res;
  } catch (error) {
    throw error;
  }
};
