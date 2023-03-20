import React from "react";
import {Formik} from "formik";
import {Form, Input} from "antd";
import * as Yup from "yup";
import css from 'styled-jsx/css'
import {Link} from "react-router-dom";
import {withRouter} from "react-router";

import {LoadingIcon} from "@app/components/core/loading-icon";
import UIButton from "@app/components/core/button";
import Layout from "@app/components/layout";
import {POST} from "@app/request";
import {LocalStore} from "@app/utils/local-storage";
import {envName} from "@app/configs";
import {loadUser} from "@app/redux/actions";
import {connect} from "react-redux";

const styles = css.global`
  
`

const Login = ({location, history, loadUser, user, profile, ...props}) => {
  const [error, setError] = React.useState("")
  const [isLoading, setLoading] = React.useState(false)
  const fields = {
    email: "email",
    password: "password",
    firstname: "firstname",
    lastname: "lastname",
  };

  const initialValues = {
    [fields.email]: "",
    [fields.password]: "",
    [fields.firstname]: "",
    [fields.lastname]: "",
  };

  const validationSchema = Yup.object({
    [fields.email]: Yup.string()
      .email("Invalid email")
      .required("Please enter your email"),
    [fields.password]: Yup.string()
      .required("Please enter a password")
      .min(6, "Must contain 6 characters"),
      [fields.lastname]: Yup.string()
      .required("Please enter a last name")
      .min(3, "Must contain 3 characters"),
      [fields.firstname]: Yup.string()
      .required("Please enter a first name")
      .min(3, "Must contain 3 characters")
  });

  const onHandleSubmit = async (formValues) => {
    setLoading(true)

    POST('/admin/signup', formValues)
      .then(({ data }) => {
        LocalStore.local.set(`${envName}-uuid`, data)
        setTimeout(() => {
          setLoading(false)
          loadUser()
          history.replace('/')
        }, 1000)
      })
      .catch((error) => {
        setLoading(false)
      })
  };

  const removeError = ({errors, name, setErrors}) => {
    const newErrors = {...errors};
    delete newErrors?.[name];
    setErrors({...newErrors});
  };

  React.useEffect(() => {
    if (user && profile === 1) {
      history.replace('/')
    }

    if(!user && profile === 1) {
      history.replace('/login')
    }
  }, [])

  return (
    <Layout title="Sign up" className="login flex justify-center h-screen">
      <div className="container">
        <div className="row">
          <div className="col-sm-3"/>
          <div className="col-sm-6">
            <div className="login-content">
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onHandleSubmit}
              >
                {(form) => {
                  const {
                    values,
                    errors,
                    handleSubmit,
                    setFieldValue,
                    setErrors,
                  } = form;

                  return (
                    <Form onFinish={handleSubmit}>
                      <div className="title-login">
                        Sign up
                      </div>
                      <Form.Item
                        className="core-form-item w-full block mb-3"
                        label="First name"
                        hasFeedback={!!errors[fields.firstname]}
                        validateStatus={errors[fields.firstname] && "error"}
                        help={errors[fields.firstname]}
                      >
                        <Input
                          name={fields.firstname}
                          placeholder=""
                          value={values[fields.firstname]}
                          onChange={({target: {value}}) => {
                            setFieldValue(fields.firstname, value, false);
                            removeError({
                              errors,
                              name: fields.firstname,
                              setErrors,
                            });
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        className="core-form-item w-full block mb-3"
                        label="Last name"
                        hasFeedback={!!errors[fields.lastname]}
                        validateStatus={errors[fields.lastname] && "error"}
                        help={errors[fields.lastname]}
                      >
                        <Input
                          name={fields.lastname}
                          placeholder=""
                          value={values[fields.lastname]}
                          onChange={({target: {value}}) => {
                            setFieldValue(fields.lastname, value, false);
                            removeError({
                              errors,
                              name: fields.lastname,
                              setErrors,
                            });
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        className="core-form-item w-full block mb-3"
                        label="Email"
                        hasFeedback={!!errors[fields.email]}
                        validateStatus={errors[fields.email] && "error"}
                        help={errors[fields.email]}
                      >
                        <Input
                          name={fields.email}
                          placeholder="email@example.com"
                          value={values[fields.email]}
                          onChange={({target: {value}}) => {
                            setFieldValue(fields.email, value, false);
                            removeError({
                              errors,
                              name: fields.email,
                              setErrors,
                            });
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        className="core-form-item w-full block"
                        validateStatus={
                          errors[fields.password] && "error"
                        }
                        help={errors[fields.password]}
                      >
                        <Input
                          type="password"
                          name={fields.password}
                          placeholder="*****"
                          value={values[fields.password]}
                          onChange={({target: {value}}) => {
                            setFieldValue(fields.password, value, false);
                            removeError({
                              errors,
                              name: fields.password,
                              setErrors,
                            });
                          }}
                        />
                      </Form.Item>
                      <div className="flex mt-10">
                        <UIButton
                          disabled={isLoading}
                          htmlType="submit"
                          className="third capitalize filled-error flex-1 mr-4">
                          {isLoading && <LoadingIcon/>}
                          Sign up
                        </UIButton>
                        <Link to="/request-password" className=" flex-1">
                          <UIButton
                            className="gray capitalize filled-error flex-1">
                            Forgot Password?
                          </UIButton>
                        </Link>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            </div>
            {
              error && (
                <div className="core-alert flex items-center">
                  <div>
                    <i className="far fa-exclamation-triangle"/>
                  </div>
                  <div>{error}</div>
                </div>
              )
            }
          </div>
          <div className="col-sm-3"/>
        </div>
      </div>
      <style jsx>{styles}</style>
    </Layout>
  )
}

const mapDispatchToProps = ({
  loadUser
})

const mapStatesToProps = (states) => ({
  profile: states.global.profile,
  user: states.global.user
})

export default connect(mapStatesToProps, mapDispatchToProps)(withRouter(Login));
