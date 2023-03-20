import React from "react";
import {Formik} from "formik";
import {Form, Input} from "antd";
import * as Yup from "yup";
import css from 'styled-jsx/css'
import {Link} from "react-router-dom";
import {withRouter} from "react-router";

import {LoadingIcon} from "@app/components/core/loading-icon";
import UIButton from "@app/components/core/button";
// import {auth} from "@app/services/firebase";
import Layout from "@app/components/layout";
import { POST, PUT } from '@app/request';

const styles = css.global`
  
`

const RequestPass = ({location, history, ...props}) => {
  const [isLoading, setLoading] = React.useState(false)
  const [isSent, setSent] = React.useState(false)
  const fields = {
    email: "email"
  };

  const initialValues = {
    [fields.email]: "",
  };

  const validationSchema = Yup.object({
    [fields.email]: Yup.string()
      .email("Invalid email")
      .required("Please enter email to receive reset password link")
  });

  console.log(process.env.NODE_URL)
  const onHandleSubmit = async (formValues) => {
    setLoading(true)
    const res = await POST('/admin/reset-password', {
      email: formValues?.email,
      "baseUrl": "https://witdoc.app"
    }).then((a) => a).catch(() => undefined)

    if(res) {
      setSent(true)
    }

    setLoading(false)
    // auth.sendPasswordResetEmail(formValues?.email).then(() => {
    //   setLoading(false)
    //   setSent(true)
    // }).catch((error) => {
    //  setLoading(false)
    // });
  };

  const removeError = ({errors, name, setErrors}) => {
    const newErrors = {...errors};
    delete newErrors?.[name];
    setErrors({...newErrors});
  };

  return (
    <Layout title="Request reset password" className="login flex ustify-center h-screen">
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
                        Reset Password
                      </div>
                      <Form.Item
                        className="core-form-item w-full block mb-3"
                        label="Email receives reset link"
                        hasFeedback={!!errors[fields.email]}
                        validateStatus={errors[fields.email] && "error"}
                        help={errors[fields.email]}
                      >
                        <Input
                          name={fields.email}
                          placeholder="Please enter email to receive reset password link"
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
                      <div className="flex mt-10">
                        <UIButton
                          disabled={isLoading}
                          htmlType="submit"
                          className="third capitalize filled-error flex-1 mr-4">
                          {isLoading && <LoadingIcon/>}
                          {isSent ? 'resend' : 'send'}
                        </UIButton>
                        <Link to="/login" className=" flex-1">
                          <UIButton
                            className="gray capitalize filled-error flex-1 w-full">
                            Back to Log In
                          </UIButton>
                        </Link>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            </div>
            {
              isSent && (
                <div className="core-alert flex items-center success">
                  <div>
                    <i className="far fa-exclamation-triangle"/>
                  </div>
                  <div>Please check your email</div>
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

export default withRouter(RequestPass)