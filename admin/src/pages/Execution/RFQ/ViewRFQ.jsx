import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ViewCard from "../../../components/ViewCard";
import apiClient from "../../../helpers/apiClient";

const ViewRFQ = () => {
  const { id } = useParams();
  const [rfqData, setRfqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRfqData = async () => {
      try {
        setLoading(true);
        let response;
        if (id) {
          response = await apiClient.get(`/add-rfqs/${id}/`);
        } else {
          // Fetch all RFQs and get the latest one (assuming ID is incremental)
          const allResponse = await apiClient.get("/add-rfqs/");
          const rfqs = allResponse.data;
          if (rfqs.length > 0) {
            const latestRfq = rfqs.reduce((latest, current) =>
              latest.id > current.id ? latest : current
            );
            response = { data: latestRfq };
          } else {
            setError("No RFQs available.");
            return;
          }
        }
        setRfqData(response.data);
      } catch (err) {
        console.error(`Failed to fetch RFQ data for ID ${id || 'latest'}:`, err);
        setError(`No RFQ matches the given query for ID ${id || 'latest'}.`);
      } finally {
        setLoading(false);
      }
    };
    fetchRfqData();
  }, [id]);

  const singleFields = [
    {
      name: "company_name",
      label: "Company Name",
      type: "text",
      required: true,
      placeholder: "Enter Company Name",
    },
    {
      name: "reference",
      label: "Reference",
      type: "text",
      required: false,
      placeholder: "Enter Reference",
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      required: true,
      placeholder: "Enter Address",
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      required: true,
      placeholder: "Enter Phone Number",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "Enter Email",
    },
    {
      name: "rfq_channel",
      label: "RFQ Channel",
      type: "select",
      required: false,
      options: rfqData?.rfq_channel ? [rfqData.rfq_channel] : [],
      placeholder: "Select RFQ Channel",
    },
    {
      name: "attention_name",
      label: "Attention Name",
      type: "text",
      required: false,
      placeholder: "Enter Attention Name",
    },
    {
      name: "attention_phone",
      label: "Attention Phone",
      type: "text",
      required: false,
      placeholder: "Enter Attention Phone",
    },
    {
      name: "attention_email",
      label: "Attention Email",
      type: "email",
      required: true,
      placeholder: "Enter Attention Email",
    },
  ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <ViewCard
        apiBaseUrl="/add-rfqs/"
        singleFields={singleFields}
        repeatableFields={[]}
        title="View Company Details"
        editPath={`/pre-job/add-rfq?id=${id || rfqData?.id}`} // Use ID if available
        showRepeatableFields={false}
        initialData={rfqData}
      />
    </div>
  );
};

export default ViewRFQ;