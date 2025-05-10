import { Button, LoadingOverlay, Select, Textarea, TextInput } from "@mantine/core";
import { ColumnProps } from "../../components/CustomTable";
import SimpleTable from "../../components/SimpleTable";
import CustomModal from "../../components/CustomModal";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import supabase from "../../supabase";
import { useEffect, useState } from "react";
import { displayConfirmation, displayError, displaySuccess, LoadingClass, toProper } from "../../helpers/methods";
import { ReasonProps, SectionProps } from "../../types";
import { tmpCourseList, tmpYearLevel } from "../../tmp_data";
import { DefaultSelectProps } from "../../assets/styles";
import PageContainer from "../../components/PageContainer";

interface SectionFormProps {
  id: number;
  course: string;
  year_level: string;
  section: string;
  type: "add" | "edit";
}

interface ReasonFormProps {
  id: number;
  reason: string;
  type: 'add' | 'edit';
}

function Maintenance() {
  const [loadingPage, setLoadingPage] = useState(true)
  const [sections, setSections] = useState<SectionProps[]>([]);
  const [reasons, setReasons] = useState<ReasonProps[]>([]);
  const [loadingSection, setLoadingSection] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [sectionState, { open: openSectionState, close: closeSectionState }] =
    useDisclosure(false);
  const [reasonState, { open: openReasonState, close: closeReasonState }] =
    useDisclosure(false);


  const sectionColumns: ColumnProps<SectionProps>[] = [
    {
      label: "Course",
      field: "course",
    },
    {
      label: "Year Level",
      field: "year_level",
    },
    {
      label: "Section",
      field: "section",
    },
  ];

  const reasonColumns: ColumnProps<ReasonFormProps>[] = [
    {
      label: "Reason",
      field: "reason",
    },
  ];

  const sectionForm = useForm<SectionFormProps>({
    mode: "controlled",
    initialValues: {
      id: 0,
      section: "",
      course: "",
      year_level: "",
      type: "add",
    },
  });

  const reasonForm = useForm<ReasonFormProps>({
    mode: "controlled",
    initialValues: {
      id: 0,
      reason: "",
      type: "add"
    },
  });

  async function sectionEventHandler(data: SectionFormProps) {
    setLoadingSection(true);

    let result;
    if (data.type === "add") {
      result = await supabase.from("sections").insert({
        course: data.course,
        year_level: data.year_level,
        section: data.section,
      });
    } else {
      result = await supabase
        .from("sections")
        .update({ section: data.section })
        .eq("id", data.id);
    }

    if (result.error) {
      displayError("Error", result.error.message);
    } else {
      displaySuccess(
        "Success",
        data.type === "add" ? "Section Added Successfully!" : "Section Updated Successfully!"
      );
      closeSectionState();
    }

    sectionForm.reset();
    setLoadingSection(false);
  }

  async function reasonEventHandler(data: ReasonFormProps) {
    setLoadingReason(true);

    let result;
    if (data.type === "add") {
      result = await supabase.from("reasons").insert({
        reason: toProper(data.reason)
      });
    } else {
      result = await supabase
        .from("reasons")
        .update({ reason: toProper(data.reason) })
        .eq("id", data.id);
    }

    if (result.error) {
      displayError("Error", result.error.message);
    } else {
      displaySuccess(
        "Success",
        data.type === "add" ? "Reason Added Successfully!" : "Reason Updated Successfully!"
      );
      closeReasonState();
    }

    reasonForm.reset();
    setLoadingReason(false);
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingPage(true)
      const { data: sectionData } = await supabase.from("sections").select("*");
      const { data: reasonData } = await supabase.from("reasons").select("*");
      setSections(sectionData || []);
      setReasons(reasonData || []);
      setLoadingPage(false)
    };
    fetchInitialData();

    const sectionSubscription = supabase
      .channel("realtime:sections")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sections" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSections((prev) => [...prev, payload.new as SectionProps]);
          } else if (payload.eventType === "UPDATE") {
            setSections((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new as SectionProps : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setSections((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const reasonSubscription = supabase
      .channel("realtime:reasons")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reasons" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReasons((prev) => [...prev, payload.new as ReasonProps]);
          } else if (payload.eventType === "UPDATE") {
            setReasons((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new as ReasonProps : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setReasons((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sectionSubscription);
      supabase.removeChannel(reasonSubscription);
    };
  }, []);

  return (
    <PageContainer title="Maintenance">

      <LoadingOverlay visible={loadingPage} />

      <CustomModal
        onClose={closeSectionState}
        opened={sectionState}
        title={
          sectionForm.values.type === "add" ? "Add Section" : "Edit Section"
        }
      >
        <form
          className="space-y-3"
          onSubmit={sectionForm.onSubmit(sectionEventHandler)}
        >
          <Select {...DefaultSelectProps} {...sectionForm.getInputProps('course')} label="Course" placeholder="Select course" data={tmpCourseList} />
          <Select {...DefaultSelectProps} {...sectionForm.getInputProps('year_level')} label="Year Level" placeholder="Select year level" data={tmpYearLevel} />
          <TextInput {...sectionForm.getInputProps('section')} label="Section (Optional)" placeholder="Enter section" />
          <Button loading={loadingSection} type="submit">
            {sectionForm.values.type === "add" ? "Add Section" : "Save Changes"}
          </Button>
        </form>
      </CustomModal>

      <CustomModal
        onClose={closeReasonState}
        opened={reasonState}
        title={
          reasonForm.values.type === "add" ? "Add Reason" : "Edit Reason"
        }
      >
        <form
          className="space-y-3"
          onSubmit={reasonForm.onSubmit(reasonEventHandler)}
        >
          <Textarea {...reasonForm.getInputProps('reason')} rows={4} label="Reason" placeholder="Enter reason here..." required />
          <Button loading={loadingReason} type="submit">
            {reasonForm.values.type === "add" ? "Add Reason" : "Save Changes"}
          </Button>
        </form>
      </CustomModal>

      <div className="w-full space-y-5">



        <SimpleTable
          title="Sections"
          onAdd={() => {
            sectionForm.reset();
            openSectionState();
          }}
          columns={sectionColumns}
          rows={sections}
          onDelete={async (v) => {
            const deleteConf = await displayConfirmation(
              "Confirmation",
              `Are you sure you want to delete "${v.section}"?`
            );

            if (!deleteConf) return;

            const load = new LoadingClass()
            load.show()

            const { error } = await supabase
              .from("sections")
              .delete()
              .eq("id", v.id);

            if (error) {
              displayError("Error", error.message);
            } else {
              displaySuccess("Delete Success", "Section Deleted Successfully!");
            }

            load.close()
          }}
          onEdit={(v) => {
            sectionForm.setValues({
              ...v,
              type: "edit",
            });
            openSectionState();
          }}
        />

        <SimpleTable
          title="Type of Reasons"
          onAdd={() => {
            reasonForm.reset();
            openReasonState();
          }}
          columns={reasonColumns}
          rows={reasons}
          onDelete={async (v) => {
            const deleteConf = await displayConfirmation(
              "Confirmation",
              `Are you sure you want to delete "${v.reason}"?`
            );

            if (!deleteConf) return;

            const load = new LoadingClass()
            load.show()

            const { error } = await supabase
              .from("reasons")
              .delete()
              .eq("id", v.id);

            if (error) {
              displayError("Error", error.message);
            } else {
              displaySuccess("Delete Success", "Section Deleted Successfully!");
            }

            load.close()
          }}
          onEdit={(v) => {
            reasonForm.setValues({
              ...v,
              type: "edit",
            });
            openReasonState();
          }}
        />
      </div>
    </PageContainer>
  );
}

export default Maintenance;
