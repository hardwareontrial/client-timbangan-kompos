<template>
  <VContainer>
    <VRow>
      <VCol md="4">
        <VRow>
          <!-- Status Section -->
          <VCol cols="12">
            <VCard style="min-height: 30vh;">
              <VCardTitle>
                Status
              </VCardTitle>
              <VList>
                <VListItem
                  title="Waktu"
                >
                  <template #append>
                    <span>{{ scalesStore.datetime}}</span>
                  </template>
                </VListItem>
                <VListItem
                  :subtitle="connections.serial['path']"
                >
                  <template #title>
                    <span>Serial Port</span>
                  </template>
                  <template #append>
                    <VChip :label="false" :color="connections.serial['status'] ? 'success' : 'error'">
                      {{ connections.serial['status'] ? 'Terhubung' : 'Terputus' }}
                    </VChip>
                  </template>
                </VListItem>
                <VListItem
                  title="MQTT"
                  :subtitle="connections.mqtt['url']"
                >
                  <template #append>
                    <VChip :label="false" :color="connections.mqtt['status'] ? 'success' : 'error'">
                      {{ connections.mqtt['status'] ? 'Terhubung' : 'Terputus' }}
                    </VChip>
                  </template>
                </VListItem>
              </VList>
            </VCard>
          </VCol>
          <!-- End Status Section -->

          <!-- Data Section -->
          <VCol cols="12">
            <VCard style="min-height: 15vh;">
              <VCardTitle>Data</VCardTitle>
              <div class="d-flex justify-center">
                <h2>[{{ dataScale.status }}]</h2>
                <h2 class="ml-2">{{ dataScale.scale }}</h2>
              </div>
            </VCard>
          </VCol>
          <!-- End Data Section -->

          <!-- Log Section -->
          <VCol cols="12">
            <VCard style="min-height: 40vh;">
              <VCardTitle>Logs</VCardTitle>
              <VList lines="one">
                <VListItem
                  v-for="(log, idx) in logs"
                  :key="idx"
                >
                  <template #title>
                    [{{ log.timestamp }}]
                  </template>
                  <template #subtitle>
                    {{ log.text }}
                  </template>
                </VListItem>
              </VList>
            </VCard>
          </VCol>
          <!-- End Log Section -->

        </VRow>
      </VCol>

      <!-- Form Section -->
      <VCol md="8">
        <VCard style="min-height: 93vh;">

          <template #title>
            <div class="d-flex justify-space-between">
              <span>Form</span>
              <VBtn size="20"
                :icon="isFormUnlocked ? 'tabler-lock-open' : 'tabler-lock'"
                variant="text"
                color="error"
                @click="scalesStore.handleFormLock"
              />
            </div>
          </template>

          <VCardText class="overflow-y-auto">
            <VRow dense>
              <VCol cols="12" md="12">
                <AppAutocomplete
                  label="Nomor Kendaraan"
                  placeholder="Pilih Nopol"
                  :items="numberPlatesList"
                  v-model="formData.vehicle_number"
                  clearable
                >
                  <template #append-inner>
                    <VProgressCircular
                      v-if="getDataByVehicleNumProcessing"
                      width="3"
                      size="20"
                      indeterminate
                    />
                  </template>
                </AppAutocomplete>
              </VCol>
              <VCol cols="12" v-show="showTransactionOpts">
                <VDivider class="mb-2" />
                <VRow>
                  <VCol cols="12" v-if="formData.document_number === ''">
                    <CustomRadios
                      :radio-content="transactionOptions_1"
                      :grid-column="{ sm: '6', cols: '12'}"
                      v-model:selected-radio="formData.scaling_1_type"
                    />
                  </VCol>
                  <VCol cols="12" v-else>
                    <CustomRadios
                      :radio-content="transactionOptions_2"
                      :grid-column="{ sm: '6', cols: '12'}"
                      v-model:selected-radio="formData.scaling_2_type"
                      :disabled="true"
                    />
                  </VCol>
                </VRow>
              </VCol>
              <VCol cols="12" v-show="showTransactionOpts">
                <VDivider class="mb-2" />
                <VRow>
                  <VCol cols="12" md="4">
                    <AppAutocomplete
                      placeholder="Pilih Operator"
                      label="Operator *"
                      :items="operatorsList"
                      v-model="formData.operator"
                      :disabled="formData.document_number !== ''"
                    />
                  </VCol>
                  <VCol cols="12" md="4">
                    <AppAutocomplete
                      label="Customer *"
                      placeholder="Pilih Customer"
                      :items="customersList"
                      v-model="formData.customer"
                      :disabled="formData.document_number !== ''"
                    />
                  </VCol>
                  <VCol cols="12" md="4">
                    <AppAutocomplete
                      label="Muatan/Produk *"
                      placeholder="Pilih Muatan"
                      :items="productsList"
                      v-model="formData.product"
                      :disabled="formData.document_number !== ''"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <div>
                      <AppTextField
                        label="Timbang 1 *"
                        placeholder="0"
                        v-model="formData.scaling_1_value"
                        @keypress="isNumber($event)"
                        :readonly="!isFormUnlocked || formData.document_number !== ''"
                      >
                        <!-- :readonly="true" -->
                        <template #append-inner>
                          <VProgressCircular
                            color="primary"
                            width="3"
                            size="22"
                            indeterminate
                            v-show="getScale1Processing"
                          />
                        </template>
                        <template #append>
                          <VBtn
                            icon="tabler-scale-outline"
                            rounded
                            size="36"
                            @click="scalesStore.getScale1"
                            :disabled="getScale1Processing"
                            v-show="!isFormUnlocked && formData.document_number === ''"
                          />
                        </template>
                      </AppTextField>
                    </div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div>
                      <AppTextField
                        label="Timbang 2 *"
                        placeholder="0"
                        v-model="formData.scaling_2_value"
                        @keypress="isNumber($event)"
                        v-show="formData.document_number !== ''"
                        :readonly="!isFormUnlocked && formData.document_number !== ''"
                      >
                        <template #append-inner>
                          <VProgressCircular
                            color="primary"
                            width="3"
                            size="22"
                            indeterminate
                            v-show="getScale2Processing"
                          />
                        </template>
                        <template #append>
                          <VBtn
                            icon="tabler-scale-outline"
                            rounded
                            size="36"
                            :disabled="getScale2Processing"
                            v-show="!isFormUnlocked"
                            @click="scalesStore.getScale2"
                          />
                        </template>
                      </AppTextField>
                    </div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppTextField
                      label="Area Kirim *"
                      placeholder="Area Kirim"
                      v-model="formData.send_to"
                      :disabled="formData.document_number !== ''"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <AppTextField
                      label="Keterangan"
                      placeholder="Masukkan Keterangan"
                      v-model="formData.note"
                    />
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCardText>
          <VCardActions class="d-flex justify-end">
            <VBtn
              variant="text"
              color="error"
              v-if="formData.document_number === ''"
              @click="scalesStore.resetForm()"
              v-show="!isFormUnlocked"
            >
              <VIcon start icon="tabler-restore"/>
              Reset
            </VBtn>
            <VBtn
              variant="text"
              color="blue"
              v-if="formData.document_number === ''"
              @click="scalesStore.processingFormData"
            >
              <VProgressCircular
                width="3"
                size="16"
                class="mr-2"
                indeterminate
                v-if="isSubmitProcessing"
              />
              <VIcon start icon="tabler-device-floppy"/>
              Simpan
            </VBtn>
            <VBtn
              variant="text"
              color="blue"
              v-if="formData.document_number !== ''"
              :disabled="getScale2Processing"
              @click="scalesStore.updatingFormData"
            >
              <VProgressCircular
                width="3"
                size="16"
                class="mr-2"
                indeterminate
                v-if="isSubmitProcessing"
              />
              <VIcon start icon="tabler-printer"/>
              Cetak
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
      <!-- End Form Section -->

    </VRow>
    <VRow>
      <!-- snackbar -->
      <VSnackbar v-model="onInfo.visible" location="top" color="blue">
        {{ onInfo.message }}
      </VSnackbar>
      <!-- end snackbar -->

      <!-- error modal -->
      <VDialog
        v-model="onErrors.visible"
        max-width="400"
        persistent
      >
        <VCard title="Error">
          <VCardText>
            <p
              class="text-sm-left mb-1"
              v-for="(msg, idx) in onErrors.messages"
            >
              <span class="mr-1"> - </span>
              <span>{{ msg }}</span>
            </p>
          </VCardText>
          <VCardActions>
            <VSpacer></VSpacer>
            <VBtn
              text="Tutup"
              color="error"
              @click="scalesStore.closingErrorDialog"
            >
              Tutup
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
      <!-- end error modal -->

      <!-- modal for auth -->
      <VDialog
        v-model="onAuthForm"
        max-width="400"
        persistent
      >
        <VCard title="Otentikasi Admin">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="formAdmin.username"
                  label="Username"
                  placeholder="Username"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="formAdmin.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>
            </VRow>
          </VCardText>
          <VCardActions>
            <VSpacer/>
            <VBtn
              text="Tutup"
              color="error"
              v-show="!isSubmitUnlockForm"
              @click="scalesStore.closeAuthModal"
            />

            <VBtn @click="scalesStore.unlockingForm()">
              <VProgressCircular
                v-show="isSubmitUnlockForm"
                width="3"
                size="16"
                class="mr-2"
                indeterminate
              />
              <span v-show="!isSubmitUnlockForm">Submit</span>
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
      <!-- end modal for auth -->
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import { useScalesStore } from '@/plugins/pinia/scale';
import type { CustomInputContent } from '@core/types';

definePage({
  meta: {
    layout: 'blank'
  }
});

const scalesStore = useScalesStore();
const {
  isFormUnlocked, onAuthForm, isSubmitUnlockForm, getDataByVehicleNumProcessing, showTransactionOpts,
  isSubmitProcessing, getScale1Processing, getScale2Processing,
  onErrors, onInfo,
  datetime, connections,
  numberPlatesList, operatorsList, productsList, customersList,
  formAdmin, formData, dataScale, transactionOptions_1, transactionOptions_2,
  logs,
} = storeToRefs(scalesStore);

const isPasswordVisible = ref<boolean>(false);
let getListInterval: NodeJS.Timeout;

const isNumber = (event:KeyboardEvent) => {
  var key = event.key
  
  if(['1','2','3','4','5','6','7','8','9','0'].includes(key)){ return true; }
  else { event.preventDefault() }
}

watch(() => scalesStore.formData.vehicle_number, (newVehNum, oldVehNum) => {
  if (newVehNum !== '' && newVehNum !== null) {
    scalesStore.getDataByVehicleNumber(newVehNum);
  } else {
    scalesStore.resetForm();
    showTransactionOpts.value = false;
  }
});
watch(() => scalesStore.formData.scaling_1_type, (newVal, oldVal) => {
  if(newVal === 'timbang-in') { scalesStore.formData.scaling_2_type = 'timbang-out' }
  else if(newVal === 'timbang-out') { scalesStore.formData.scaling_2_type = 'timbang-in' }
  else { scalesStore.formData.scaling_2_type = '' }
  //
});

onMounted(() => {
  scalesStore.getDataList();

  getListInterval = setInterval(() => {
    scalesStore.getDataList();
    window.electronAPI.getStatusConn();
  }, 10000);

  // window.electronAPI.onNotify((message) => {
  //   scalesStore.setNotify(true, message);
  // });
  // window.electronAPI.onError((messages) => {
  //   scalesStore.setErrors(true, messages);
  // });

  window.electronAPI.onStatusConn((data) => {
    console.log(data)
    connections.value.mqtt['url'] = data.mqtt.url;
    connections.value.mqtt['status'] = data.mqtt.status;
    connections.value.serial['path'] = data.serial.path;
    connections.value.serial['status'] = data.serial.status;
  });

  window.electronAPI.onDatetime((data) => {
    datetime.value = data;
  });

  window.electronAPI.onValidatingUnlockForm((result) => {
    scalesStore.setFormLockStatus(result)
  });

  window.electronAPI.onScaleDataRT((result) => {
    scalesStore.setDataScale(result);
  });

  // window.electronAPI.onAppLog((result) => {
  //   logs.value = [];
  //   logs.value = result;
  // })
});

onBeforeUnmount(() => {
  clearInterval(getListInterval);
})
</script>
