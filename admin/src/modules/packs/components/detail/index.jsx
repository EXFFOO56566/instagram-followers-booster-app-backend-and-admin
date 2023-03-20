import {Form, Input, notification, Select} from "antd";
import UICPopup from "@app/components/core/popup/cpopup";
import React from "react";
import * as Yup from "yup";
import CurrencyFormat from 'react-currency-format';
import {Formik} from "formik";
import UIButton from "@app/components/core/button";
import {removeError} from "@app/utils";
import Can from "@app/services/casl/can";
import {runFunction} from "@app/services/casl/ability";
import {POST, PUT} from "@app/request";

export const PackDetail = ({onClose, cb, data = undefined}) => {
  const [formData, setFormData] = React.useState({
    packageName: undefined,
    packagePricing: undefined,
    packageStars: undefined,
    packagePlatform: undefined,
    packageId: undefined,
  });

  const validateSchema = Yup.object({
    packageStars: Yup.number().required("Please input number of stars"),
    packageName: Yup.string().required("Please input name"),
    packagePricing: Yup.number().required("Please input pricing"),
    packageId: Yup.string().required("Please input purchase id"),
    packagePlatform: Yup.string().required("Please select operating system"),
  });

  React.useEffect(() => {
    if (data) {
      setFormData({
        packageName: data?.packageName,
        packagePricing: data?.packagePricing,
        packageStars: data?.packageStars,
        packagePlatform: data?.packagePlatform,
        packageId: data?.packageId,
      });
    }
  }, []);

  const create = (form) => {
    POST(`/admin/createPackage`, {
        packageName: form?.packageName,
        packagePricing: form?.packagePricing,
        packageStars: form?.packageStars,
        packagePlatform: form?.packagePlatform,
        packageId: form?.packageId,
    })
      .then(({data}) => {
        notification.info({
          description: `Package was created successfully`,
          placement: "bottomRight",
          duration: 2,
          icon: "",
          className: "core-notification info",
        });
        onClose()
        cb()
      })
      .catch((err) => {
        notification.info({
          description: `Package was created failure`,
          placement: "bottomRight",
          duration: 2,
          icon: "",
          className: "core-notification error",
        });
      })
  }

  const update = (form) => {
    PUT(`/admin/updatePackage/${data?._id}`, {
      packageName: form?.packageName,
      packagePricing: form?.packagePricing,
      packageStars: form?.packageStars,
      packagePlatform: form?.packagePlatform,
      packageId: form?.packageId,
    })
      .then(({data}) => {
        notification.info({
          description: `Package was updated successfully`,
          placement: "bottomRight",
          duration: 2,
          icon: "",
          className: "core-notification info",
        });
        onClose()
        cb()
      })
      .catch((err) => {
        notification.info({
          description: `Package was updated failure`,
          placement: "bottomRight",
          duration: 2,
          icon: "",
          className: "core-notification error",
        });
      })
  }

  return (
    <UICPopup
      hiddenFooter={true}
      onCancel={onClose}
      textCancel="Cancel"
      textOk="Save"
      title={`${data ? "Update" : "New"} Pack`}
      width={416}
    >
      <Formik
        onSubmit={(e) => {
          runFunction(() => {
            if (!data) {
              create(e)
            } else {
              update(e);
            }
          });
        }}
        validationSchema={validateSchema}
        initialValues={formData}
        enableReinitialize
      >
        {({setErrors, setFieldValue, errors, values, handleSubmit}) => {

          return (
            <Form onFinish={handleSubmit} className="block w-full">
              <Form.Item
                hasFeedback={!!errors["packageName"]}
                validateStatus={errors["packageName"] && "error"}
                help={errors["packageName"]}
                className="core-form-item w-full mb-2 block"
                label="Pack name"
              >
                <Input
                  onChange={({target: {value}}) => {
                    setFieldValue("packageName", value, false);
                    removeError({
                      errors,
                      name: "packageName",
                      setErrors,
                    });
                  }}
                  placeholder="Pack name"
                  value={values?.packageName}
                  className="w-full"
                />
              </Form.Item>
              <Form.Item
                hasFeedback={!!errors["packagePricing"]}
                validateStatus={errors["packagePricing"] && "error"}
                help={errors["packagePricing"]}
                className="core-form-item w-full mb-2 block"
                label="Pricing"
              >
                <CurrencyFormat
                  style={{padding: '4px 11px'}}
                  thousandSeparator={true}
                  prefix={'$'}
                  onValueChange={({formattedValue, value}) => {
                    setFieldValue("packagePricing", parseFloat(value) || 0, false);
                    removeError({
                      errors,
                      name: "packagePricing",
                      setErrors,
                    });
                  }}
                  placeholder="Pricing"
                  value={values?.packagePricing}
                  className="w-full"
                />
              </Form.Item>
              <Form.Item
                hasFeedback={!!errors["packageStars"]}
                validateStatus={errors["packageStars"] && "error"}
                help={errors["packageStars"]}
                className="core-form-item w-full mb-2 block"
                label="number of stars"
              >
                <Input
                  type="number"
                  onChange={({target: {value}}) => {
                    setFieldValue("packageStars", value, false);
                    removeError({
                      errors,
                      name: "packageStars",
                      setErrors,
                    });
                  }}
                  placeholder="Number of stars"
                  value={values?.packageStars}
                  className="w-full"
                />
              </Form.Item>
              <Form.Item
                hasFeedback={!!errors["packageId"]}
                validateStatus={errors["packageId"] && "error"}
                help={errors["packageId"]}
                className="core-form-item w-full mb-2 block"
                label="purchase id"
              >
                <Input
                  onChange={({target: {value}}) => {
                    setFieldValue("packageId", value, false);
                    removeError({
                      errors,
                      name: "packageId",
                      setErrors,
                    });
                  }}
                  placeholder="Purchase id"
                  value={values?.packageId}
                  className="w-full"
                />
              </Form.Item>
              <Form.Item
                hasFeedback={!!errors["packagePlatform"]}
                validateStatus={errors["packagePlatform"] && "error"}
                help={errors["packagePlatform"]}
                className="core-form-item w-full mb-2 block"
                label="Platform"
              >
                <Select
                  onChange={(value) => {
                    setFieldValue("packagePlatform", value, false)
                    removeError({
                      errors,
                      name: "packagePlatform",
                      setErrors,
                    });
                  }}
                  placeholder="Platform" value={values?.packagePlatform} className="w-full">
                  <Select.Option value={"Android"}>Android</Select.Option>
                  <Select.Option value={"iOS"}>iOS</Select.Option>
                </Select>
              </Form.Item>
              <div className="flex justify-end pt-4 border-0 border-t border-solid border-gray-200">
                <UIButton onClick={onClose} className="ghost border mr-4">
                  Cancel
                </UIButton>
                <Can I="edit" a="functions">
                  <UIButton
                    htmlType="submit"
                    className="secondary"
                    style={{background: "var(--third-color)"}}
                  >
                    Save
                  </UIButton>
                </Can>
              </div>
            </Form>
          );
        }}
      </Formik>
    </UICPopup>
  );
}
